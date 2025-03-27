import { 
  DailyDistribution, 
  DailyDistributionByInstrument, 
  MonthlyDistribution 
} from '@/types/pricing';
import { Instrument } from '@/types/common';
import { countWorkingDays, isWeekend, standardizeMonthCode } from './workingDaysUtils';
import { format, isWithinInterval, parse, isAfter, isBefore, max, min } from 'date-fns';

/**
 * Check if a date range (startDate-endDate) overlaps with a pricing period (pricingStart-pricingEnd)
 * Safely handles potentially undefined pricing period dates
 * @param startDate Start of selected date range
 * @param endDate End of selected date range
 * @param pricingStart Start of pricing period
 * @param pricingEnd End of pricing period
 * @returns True if there is an overlap, false otherwise
 */
export function isDateWithinPricingPeriod(
  startDate: Date,
  endDate: Date,
  pricingStart: Date | null | undefined,
  pricingEnd: Date | null | undefined
): boolean {
  // If either pricing date is missing, we can't determine overlap, so return false
  if (!pricingStart || !pricingEnd) {
    return false;
  }
  
  // Check if date ranges overlap
  // Two date ranges overlap if the start of one is before or equal to the end of the other,
  // AND the end of one is after or equal to the start of the other
  return (
    isBeforeOrEqual(startDate, pricingEnd) && 
    isAfterOrEqual(endDate, pricingStart)
  );
}

/**
 * Helper function to check if date1 is before or equal to date2
 */
function isBeforeOrEqual(date1: Date, date2: Date): boolean {
  return isBefore(date1, date2) || date1.getTime() === date2.getTime();
}

/**
 * Helper function to check if date1 is after or equal to date2
 */
function isAfterOrEqual(date1: Date, date2: Date): boolean {
  return isAfter(date1, date2) || date1.getTime() === date2.getTime();
}

/**
 * Get the overlapping days between two date ranges
 * @param filterStart Start of filter date range
 * @param filterEnd End of filter date range
 * @param pricingStart Start of pricing period
 * @param pricingEnd End of pricing period
 * @returns Object with start and end dates of the overlap, or null if no overlap
 */
export function getOverlappingDays(
  filterStart: Date,
  filterEnd: Date,
  pricingStart: Date,
  pricingEnd: Date
): { start: Date, end: Date } | null {
  // If date ranges don't overlap, return null
  if (!isDateWithinPricingPeriod(filterStart, filterEnd, pricingStart, pricingEnd)) {
    return null;
  }
  
  // Get the later of the two start dates
  const overlapStart = filterStart > pricingStart ? filterStart : pricingStart;
  
  // Get the earlier of the two end dates
  const overlapEnd = filterEnd < pricingEnd ? filterEnd : pricingEnd;
  
  return { start: overlapStart, end: overlapEnd };
}

/**
 * Convert a month code (e.g., "Mar-24") to start and end dates
 * @param monthCode The month code in format "MMM-YY"
 * @returns Object with start and end dates for the month
 */
export function monthCodeToDates(monthCode: string): { start: Date, end: Date } {
  // Ensure the month code is standardized
  const standardizedMonthCode = standardizeMonthCode(monthCode);
  
  // Parse the month code (e.g., "Mar-24")
  const [monthStr, yearStr] = standardizedMonthCode.split('-');
  const year = 2000 + parseInt(yearStr);
  
  // Get the month number (0-11)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = monthNames.findIndex(m => m === monthStr);
  
  if (monthIndex === -1) {
    throw new Error(`Invalid month code: ${monthCode} (standardized: ${standardizedMonthCode})`);
  }
  
  // Create the start date (first day of month)
  const start = new Date(year, monthIndex, 1);
  
  // Create the end date (last day of month)
  const end = new Date(year, monthIndex + 1, 0);
  
  return { start, end };
}

/**
 * Calculate daily distribution from monthly distribution considering pricing period
 * @param monthlyDistribution The monthly distribution object
 * @param pricingStart Start date of pricing period
 * @param pricingEnd End date of pricing period 
 * @returns Daily distribution object
 */
export function calculateDailyDistribution(
  monthlyDistribution: MonthlyDistribution,
  pricingStart: Date,
  pricingEnd: Date
): DailyDistribution {
  const dailyDistribution: DailyDistribution = {};
  
  // Calculate total working days in the pricing period
  const totalWorkingDaysInPricingPeriod = countWorkingDays(pricingStart, pricingEnd);
  
  if (totalWorkingDaysInPricingPeriod === 0) {
    console.warn(`No working days found in pricing period from ${format(pricingStart, 'yyyy-MM-dd')} to ${format(pricingEnd, 'yyyy-MM-dd')}`);
    return dailyDistribution;
  }
  
  // Calculate total exposure across all months
  const totalExposure = Object.values(monthlyDistribution).reduce((sum, value) => sum + value, 0);
  
  // Calculate value per working day across the entire pricing period
  const valuePerDay = totalExposure / totalWorkingDaysInPricingPeriod;
  
  // Distribute values to each working day in the pricing period
  const currentDate = new Date(pricingStart);
  while (currentDate <= pricingEnd) {
    if (!isWeekend(currentDate)) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      dailyDistribution[dateString] = valuePerDay;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyDistribution;
}

/**
 * Filter daily distribution by date range, considering pricing period overlap
 * @param dailyDistribution The daily distribution object
 * @param filterStart Start date of the filter range
 * @param filterEnd End date of the filter range
 * @param pricingStart Start date of pricing period
 * @param pricingEnd End date of pricing period
 * @returns Filtered daily distribution
 */
export function filterDailyDistributionByDateRange(
  dailyDistribution: DailyDistribution,
  filterStart: Date,
  filterEnd: Date,
  pricingStart: Date,
  pricingEnd: Date
): DailyDistribution {
  const filteredDistribution: DailyDistribution = {};
  
  // Get overlapping date range
  const overlap = getOverlappingDays(filterStart, filterEnd, pricingStart, pricingEnd);
  
  // If there's no overlap, return empty distribution
  if (!overlap) {
    return filteredDistribution;
  }
  
  // Filter daily distribution to only include dates in the overlapping range
  Object.entries(dailyDistribution).forEach(([dateString, value]) => {
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      
      if (isWithinInterval(date, { start: overlap.start, end: overlap.end })) {
        filteredDistribution[dateString] = value;
      }
    } catch (error) {
      console.error(`Error filtering distribution for date ${dateString}:`, error);
    }
  });
  
  return filteredDistribution;
}

/**
 * Sum all values in a daily distribution
 * @param dailyDistribution The daily distribution object
 * @returns Total sum of all values
 */
export function sumDailyDistribution(dailyDistribution: DailyDistribution): number {
  return Object.values(dailyDistribution).reduce((sum, value) => sum + value, 0);
}

/**
 * Convert instrument monthly distributions to daily distributions
 * @param instrumentDistributions Record of instruments and their monthly distributions
 * @param pricingPeriods Record of instruments and their pricing periods
 * @returns Record of instruments and their daily distributions
 */
export function calculateDailyDistributionByInstrument(
  instrumentDistributions: Record<Instrument, MonthlyDistribution>,
  pricingPeriods: Record<Instrument, { start: Date, end: Date }>
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  Object.entries(instrumentDistributions).forEach(([instrument, monthlyDist]) => {
    const pricingPeriod = pricingPeriods[instrument];
    if (pricingPeriod) {
      result[instrument] = calculateDailyDistribution(
        monthlyDist, 
        pricingPeriod.start, 
        pricingPeriod.end
      );
    } else {
      console.warn(`No pricing period found for instrument ${instrument}`);
    }
  });
  
  return result;
}

/**
 * Filter daily distributions by date range for all instruments, considering pricing periods
 * @param dailyDistributions Record of instruments and their daily distributions
 * @param filterStart Start date of the range
 * @param filterEnd End date of the range
 * @param pricingPeriods Record of instruments and their pricing periods
 * @returns Filtered daily distributions by instrument
 */
export function filterDailyDistributionsByDateRange(
  dailyDistributions: DailyDistributionByInstrument,
  filterStart: Date,
  filterEnd: Date,
  pricingPeriods: Record<Instrument, { start: Date, end: Date }>
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  Object.entries(dailyDistributions).forEach(([instrument, dailyDist]) => {
    const pricingPeriod = pricingPeriods[instrument];
    if (pricingPeriod) {
      result[instrument] = filterDailyDistributionByDateRange(
        dailyDist, 
        filterStart, 
        filterEnd,
        pricingPeriod.start,
        pricingPeriod.end
      );
    } else {
      console.warn(`No pricing period found for instrument ${instrument}`);
    }
  });
  
  return result;
}

/**
 * Calculate total exposure values from filtered daily distributions
 * @param filteredDailyDistributions Filtered daily distributions by instrument
 * @returns Record of instruments and their total exposure values
 */
export function calculateTotalExposureFromDailyDistributions(
  filteredDailyDistributions: DailyDistributionByInstrument
): Record<Instrument, number> {
  const result: Record<string, number> = {};
  
  Object.entries(filteredDailyDistributions).forEach(([instrument, dailyDist]) => {
    const totalExposure = sumDailyDistribution(dailyDist);
    if (totalExposure !== 0) {
      result[instrument] = totalExposure;
    }
  });
  
  return result as Record<Instrument, number>;
}

// Cache for daily distributions to optimize performance
const dailyDistributionCache = new Map<string, DailyDistribution>();

/**
 * Get or calculate daily distribution with caching
 * @param monthlyDistribution The monthly distribution object
 * @param pricingStart Start of pricing period
 * @param pricingEnd End of pricing period
 * @param cacheKey A unique key for caching (e.g., instrument name)
 * @returns Daily distribution object
 */
export function getCachedDailyDistribution(
  monthlyDistribution: MonthlyDistribution,
  pricingStart: Date,
  pricingEnd: Date,
  cacheKey: string
): DailyDistribution {
  // Create a cache signature based on the monthly distribution, pricing period and key
  const cacheSignature = `${cacheKey}:${JSON.stringify(monthlyDistribution)}:${format(pricingStart, 'yyyy-MM-dd')}:${format(pricingEnd, 'yyyy-MM-dd')}`;
  
  // Check if we have a cached result
  if (dailyDistributionCache.has(cacheSignature)) {
    return dailyDistributionCache.get(cacheSignature)!;
  }
  
  // Calculate new distribution
  const dailyDistribution = calculateDailyDistribution(monthlyDistribution, pricingStart, pricingEnd);
  
  // Cache the result
  dailyDistributionCache.set(cacheSignature, dailyDistribution);
  
  return dailyDistribution;
}

/**
 * Clear the daily distribution cache
 * Useful when trades change and cache needs to be invalidated
 */
export function clearDailyDistributionCache(): void {
  dailyDistributionCache.clear();
}

/**
 * Format a number with a sign and commas for display
 * @param num The number to format
 * @returns Formatted string with sign and commas
 */
export function formatNumber(num: number): string {
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
