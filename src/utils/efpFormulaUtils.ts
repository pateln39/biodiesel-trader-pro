
import { PricingFormula } from '@/types';
import { BuySell } from '@/types';
import { createEmptyExposureResult } from './formulaCalculation';
import { addDays, format, isWeekend, parse, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { mapProductToCanonical } from '@/utils/productMapping';

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
  try {
    // Parse the designated month (format: "Jun-25" or "June-25")
    const parsedDate = parse(designatedMonth, 'MMM-yy', new Date());
    
    // If parsing failed, log and return empty object
    if (isNaN(parsedDate.getTime())) {
      console.error(`[EFP] Failed to parse designated month: ${designatedMonth}`);
      return {};
    }
    
    // Get first and last day of the month
    const firstDay = startOfMonth(parsedDate);
    const lastDay = endOfMonth(parsedDate);
    
    // Count business days in the month
    const businessDaysCount = countBusinessDays(firstDay, lastDay);
    
    if (businessDaysCount === 0) {
      console.error(`[EFP] No business days found in month: ${designatedMonth}`);
      return {}; // No valid business days
    }
    
    // Calculate daily exposure (exposure divided equally among business days)
    const dailyExposure = exposureValue / businessDaysCount;
    
    // Build daily distribution object
    const dailyDistribution: Record<string, number> = {};
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      if (!isWeekend(currentDate)) {
        // Use ISO date format (YYYY-MM-DD) for consistency
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        dailyDistribution[dateKey] = dailyExposure;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    // Log successful distribution creation with sample of dates
    const dateKeys = Object.keys(dailyDistribution);
    console.log(`[EFP] Created daily distribution for ${designatedMonth} with ${businessDaysCount} business days, total exposure: ${exposureValue}`);
    
    return dailyDistribution;
  } catch (error) {
    console.error(`[EFP] Error calculating daily distribution for ${designatedMonth}:`, error);
    return {};
  }
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
  if (!isAgreed) {
    // The exposure direction is opposite of the physical trade
    // Buy physical = sell futures = negative pricing exposure
    // Sell physical = buy futures = positive pricing exposure
    const exposureDirection = buySell === 'buy' ? -1 : 1;
    const exposureValue = quantity * exposureDirection;
    
    // Store the raw instrument name for daily distribution
    const rawInstrumentName = 'ICE GASOIL FUTURES (EFP)';
    
    // Get the canonical name for consistent mapping in the exposure table
    const canonicalName = mapProductToCanonical(rawInstrumentName);
    
    console.log(`[EFP] Creating formula with raw instrument name: ${rawInstrumentName}, maps to: ${canonicalName}`);
    
    // Set the exposure using the raw instrument name which will be mapped later
    formula.exposures.pricing[rawInstrumentName] = exposureValue;
    
    // Calculate and add daily distribution for the EFP's designated month
    const dailyDist = calculateEfpDailyDistribution(exposureValue, designatedMonth);
    formula.dailyDistribution = {
      [rawInstrumentName]: dailyDist
    };
    
    // Log the total exposure being created
    console.log(`[EFP] Created formula with total exposure ${exposureValue} for ${designatedMonth}`);
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
  
  // Store the raw instrument name for daily distribution
  const rawInstrumentName = 'ICE GASOIL FUTURES (EFP)';
  
  // Get the canonical name for consistent mapping in the exposure table
  const canonicalName = mapProductToCanonical(rawInstrumentName);
  
  // Reset both EFP instruments to avoid contamination
  updatedFormula.exposures.pricing['ICE GASOIL FUTURES'] = 0;
  updatedFormula.exposures.pricing[rawInstrumentName] = 0;
  
  // Only set exposure for unagreed EFPs
  if (!isAgreed) {
    // The exposure direction is opposite of the physical trade
    const exposureDirection = buySell === 'buy' ? -1 : 1;
    const exposureValue = quantity * exposureDirection;
    
    // Log the mapping for debugging
    console.log(`[EFP] Updating formula with raw instrument name: ${rawInstrumentName}, maps to: ${canonicalName}`);
    
    // Set the exposure using the raw instrument name which will be mapped later
    updatedFormula.exposures.pricing[rawInstrumentName] = exposureValue;
    
    // Calculate and add daily distribution for the EFP's designated month
    const dailyDist = calculateEfpDailyDistribution(exposureValue, designatedMonth);
    
    // Ensure the dailyDistribution object exists
    updatedFormula.dailyDistribution = updatedFormula.dailyDistribution || {};
    
    // Add or replace the distribution using the raw instrument name
    updatedFormula.dailyDistribution[rawInstrumentName] = dailyDist;
    
    // Log the exposure value for debugging
    console.log(`[EFP] Updated formula with exposure ${exposureValue} for ${designatedMonth}`);
  } else {
    // For agreed EFPs, remove any existing daily distribution for this instrument
    if (updatedFormula.dailyDistribution?.[rawInstrumentName]) {
      console.log('[EFP] Removing dailyDistribution for agreed EFP trade');
      const { [rawInstrumentName]: _, ...restDistribution } = updatedFormula.dailyDistribution;
      updatedFormula.dailyDistribution = restDistribution;
    }
  }
  
  return updatedFormula;
};
