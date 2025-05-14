
import { PricingFormula } from '@/types/pricing';
import { BuySell } from '@/types';
import { createEmptyExposureResult } from './formulaCalculation';
import { addDays, format, isWeekend, parse, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

/**
 * Count the number of business days (Monday-Friday) in a date range
 */
const countBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (!isWeekend(currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return count;
};

/**
 * Calculate daily distribution for EFP trades based on the designated month
 */
const calculateEfpDailyDistribution = (
  exposureValue: number,
  designatedMonth: string
): Record<string, number> => {
  // Parse the designated month (format: "Jun-25" or "June-25")
  const parsedDate = parse(designatedMonth, 'MMM-yy', new Date());
  
  // Get first and last day of the month
  const firstDay = startOfMonth(parsedDate);
  const lastDay = endOfMonth(parsedDate);
  
  // Count business days in the month
  const businessDaysCount = countBusinessDays(firstDay, lastDay);
  
  if (businessDaysCount === 0) {
    return {}; // No valid business days
  }
  
  // Calculate daily exposure (exposure divided equally among business days)
  const dailyExposure = exposureValue / businessDaysCount;
  
  // Build daily distribution object
  const dailyDistribution: Record<string, number> = {};
  let currentDate = new Date(firstDay);
  
  while (currentDate <= lastDay) {
    if (!isWeekend(currentDate)) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      dailyDistribution[dateKey] = dailyExposure;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return dailyDistribution;
};

/**
 * Create a formula object specifically for EFP trades
 * This is needed because EFP trades don't use the traditional formula builder
 * but still need to maintain proper exposure tracking
 */
export const createEfpFormula = (
  quantity: number,
  buySell: BuySell,
  isAgreed: boolean,
  designatedMonth: string
): PricingFormula => {
  // Create base formula structure
  const formula: PricingFormula = {
    tokens: [], // EFP trades don't use formula tokens
    exposures: createEmptyExposureResult(),
  };
  
  // Set the appropriate exposure only for unagreed EFPs
  // For EFP, we track exposure in ICE GASOIL FUTURES (EFP) only
  if (!isAgreed) {
    // The exposure direction is opposite of the physical trade
    // Buy physical = sell futures = negative pricing exposure
    // Sell physical = buy futures = positive pricing exposure
    const exposureDirection = buySell === 'buy' ? -1 : 1;
    const exposureValue = quantity * exposureDirection;
    
    // Set the exposure - use the consistent 'ICE GASOIL FUTURES (EFP)' name
    formula.exposures.pricing['ICE GASOIL FUTURES (EFP)'] = exposureValue;
    
    // Calculate and add daily distribution for the EFP's designated month
    formula.dailyDistribution = {
      'ICE GASOIL FUTURES (EFP)': calculateEfpDailyDistribution(exposureValue, designatedMonth)
    };
  }
  
  return formula;
};

/**
 * Update an existing formula with EFP-specific exposure
 */
export const updateFormulaWithEfpExposure = (
  formula: PricingFormula | undefined,
  quantity: number,
  buySell: BuySell,
  isAgreed: boolean,
  designatedMonth: string
): PricingFormula => {
  if (!formula) {
    return createEfpFormula(quantity, buySell, isAgreed, designatedMonth);
  }
  
  // Reset existing EFP exposures
  const updatedFormula = { ...formula };
  updatedFormula.exposures = { ...updatedFormula.exposures };
  updatedFormula.exposures.pricing = { ...updatedFormula.exposures.pricing };
  
  // Reset both EFP instruments to avoid contamination
  updatedFormula.exposures.pricing['ICE GASOIL FUTURES'] = 0;
  updatedFormula.exposures.pricing['ICE GASOIL FUTURES (EFP)'] = 0;
  
  // Only set exposure for unagreed EFPs
  if (!isAgreed) {
    // The exposure direction is opposite of the physical trade
    const exposureDirection = buySell === 'buy' ? -1 : 1;
    const exposureValue = quantity * exposureDirection;
    
    // Set the exposure - use the consistent 'ICE GASOIL FUTURES (EFP)' name
    updatedFormula.exposures.pricing['ICE GASOIL FUTURES (EFP)'] = exposureValue;
    
    // Calculate and add daily distribution for the EFP's designated month
    updatedFormula.dailyDistribution = {
      ...(updatedFormula.dailyDistribution || {}),
      'ICE GASOIL FUTURES (EFP)': calculateEfpDailyDistribution(exposureValue, designatedMonth)
    };
  } else {
    // For agreed EFPs, remove any existing daily distribution for this instrument
    if (updatedFormula.dailyDistribution?.['ICE GASOIL FUTURES (EFP)']) {
      const { ['ICE GASOIL FUTURES (EFP)']: _, ...restDistribution } = updatedFormula.dailyDistribution;
      updatedFormula.dailyDistribution = restDistribution;
    }
  }
  
  return updatedFormula;
};
