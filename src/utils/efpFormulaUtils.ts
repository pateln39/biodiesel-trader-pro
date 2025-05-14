
import { PricingFormula } from '@/types';
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
    console.log(`[EFP] Sample dates: ${dateKeys.slice(0, 3).join(', ')} (${dateKeys.length} total days)`);
    
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
    const dailyDist = calculateEfpDailyDistribution(exposureValue, designatedMonth);
    formula.dailyDistribution = {
      'ICE GASOIL FUTURES (EFP)': dailyDist
    };
    
    // Log the distribution creation
    console.log(`[EFP] Created formula with ${Object.keys(dailyDist).length} days of distribution for ${designatedMonth}`);
  } else {
    console.log(`[EFP] Created formula for agreed EFP trade (no exposure tracking needed)`);
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
    const dailyDist = calculateEfpDailyDistribution(exposureValue, designatedMonth);
    
    // Ensure the dailyDistribution object exists
    updatedFormula.dailyDistribution = updatedFormula.dailyDistribution || {};
    
    // Add or replace the ICE GASOIL FUTURES (EFP) distribution
    updatedFormula.dailyDistribution['ICE GASOIL FUTURES (EFP)'] = dailyDist;
    
    // Log the distribution update
    console.log(`[EFP] Updated EFP formula for ${designatedMonth} with ${Object.keys(dailyDist).length} days of distribution`);
  } else {
    // For agreed EFPs, remove any existing daily distribution for this instrument
    if (updatedFormula.dailyDistribution?.['ICE GASOIL FUTURES (EFP)']) {
      console.log('[EFP] Removing dailyDistribution for agreed EFP trade');
      const { ['ICE GASOIL FUTURES (EFP)']: _, ...restDistribution } = updatedFormula.dailyDistribution;
      updatedFormula.dailyDistribution = restDistribution;
    }
  }
  
  return updatedFormula;
};
