
import { ExposureResult, Instrument } from '@/types/common';
import { DailyExposureRate, PricingFormula } from '@/types/pricing';
import { formatMonthCode, countBusinessDays, isBusinessDay } from './dateUtils';

/**
 * Calculate daily exposure rate for a formula
 */
export function calculateDailyExposureRate(
  pricingExposure: Record<Instrument, number>,
  pricingPeriodStart: Date,
  pricingPeriodEnd: Date
): DailyExposureRate {
  const businessDays = countBusinessDays(pricingPeriodStart, pricingPeriodEnd);
  const dailyRates: DailyExposureRate = {};

  if (businessDays <= 0) {
    console.warn(`Zero business days found for period ${pricingPeriodStart.toISOString()} - ${pricingPeriodEnd.toISOString()}. Daily rates set to 0.`);
    Object.keys(pricingExposure).forEach(instrument => {
      dailyRates[instrument] = 0;
    });
    return dailyRates;
  }

  Object.entries(pricingExposure).forEach(([instrument, totalExp]) => {
    dailyRates[instrument] = totalExp !== 0 ? totalExp / businessDays : 0;
  });

  return dailyRates;
}

/**
 * Get start and end dates for a given month code
 */
export function getMonthDates(monthCode: string): { startDate: Date, endDate: Date } | null {
  try {
    const [monthStr, yearStr] = monthCode.split('-');
    const year = 2000 + parseInt(yearStr);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.findIndex(m => m === monthStr);
    
    if (monthIndex === -1) return null;

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0); // Last day of the month
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  } catch (e) {
    console.error("Error parsing month code:", monthCode, e);
    return null;
  }
}

/**
 * Count overlapping business days between two date ranges
 */
export function countOverlappingBusinessDays(
  period1Start: Date, 
  period1End: Date,
  period2Start: Date, 
  period2End: Date
): number {
  const overlapStartMs = Math.max(period1Start.getTime(), period2Start.getTime());
  const overlapEndMs = Math.min(period1End.getTime(), period2End.getTime());

  if (overlapStartMs > overlapEndMs) {
    return 0; // No overlap
  }

  const overlapStart = new Date(overlapStartMs);
  const overlapEnd = new Date(overlapEndMs);

  // Ensure dates are aligned to prevent timezone issues
  overlapStart.setHours(0, 0, 0, 0);
  overlapEnd.setHours(23, 59, 59, 999);

  return countBusinessDays(overlapStart, overlapEnd);
}

/**
 * Calculate prorated exposure for a date range
 */
export function calculateProratedExposure(
  formula: PricingFormula | undefined,
  filterStartDate: Date | null,
  filterEndDate: Date | null,
  pricingPeriodStart: Date,
  pricingPeriodEnd: Date,
  monthCode: string,
  buySell: 'buy' | 'sell',
  quantity: number,
  isEfp: boolean = false,
  efpDesignatedMonth?: string
): Record<string, number> {
  const result: Record<string, number> = {};
  
  if (!formula) return result;

  // Default filter to entire pricing period if not specified
  const effectiveFilterStart = filterStartDate || new Date(pricingPeriodStart);
  const effectiveFilterEnd = filterEndDate || new Date(pricingPeriodEnd);
  
  // For EFP trades, handle specially
  if (isEfp && efpDesignatedMonth) {
    // Only process if this is the designated month
    if (efpDesignatedMonth === monthCode) {
      const monthDates = getMonthDates(monthCode);
      if (!monthDates) return result;
      
      const { startDate: monthStart, endDate: monthEnd } = monthDates;
      const businessDaysInMonth = countBusinessDays(monthStart, monthEnd);
      
      if (businessDaysInMonth <= 0) return result;
      
      // Calculate total EFP exposure
      const totalEfpExposure = quantity * (buySell === 'buy' ? -1 : 1);
      const dailyEfpRate = totalEfpExposure / businessDaysInMonth;
      
      // Calculate overlapping business days between filter and month
      const overlappingDays = countOverlappingBusinessDays(
        monthStart, monthEnd,
        effectiveFilterStart, effectiveFilterEnd
      );
      
      if (overlappingDays > 0) {
        result['ICE GASOIL FUTURES (EFP)'] = dailyEfpRate * overlappingDays;
      }
    }
    return result;
  }
  
  // For standard trades with daily exposure rates
  if (formula.dailyExposureRate) {
    const monthDates = getMonthDates(monthCode);
    if (!monthDates) return result;
    
    const { startDate: monthStart, endDate: monthEnd } = monthDates;
    
    // Calculate overlap between filter, month, and pricing period
    const overlapStart = new Date(
      Math.max(
        monthStart.getTime(),
        effectiveFilterStart.getTime(),
        pricingPeriodStart.getTime()
      )
    );
    
    const overlapEnd = new Date(
      Math.min(
        monthEnd.getTime(),
        effectiveFilterEnd.getTime(),
        pricingPeriodEnd.getTime()
      )
    );
    
    if (overlapStart > overlapEnd) return result;
    
    const overlappingDays = countBusinessDays(overlapStart, overlapEnd);
    
    if (overlappingDays > 0) {
      Object.entries(formula.dailyExposureRate).forEach(([instrument, rate]) => {
        result[instrument] = rate * overlappingDays;
      });
    }
  }
  
  return result;
}
