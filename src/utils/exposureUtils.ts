import { 
  DailyDistribution, 
  DailyDistributionByInstrument, 
  MonthlyDistribution 
} from '@/types/pricing';
import { Instrument } from '@/types/common';
import { countWorkingDays, isWeekend } from './workingDaysUtils';
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
 * Convert a month code (e.g., "Mar-24") to start and end dates
 * @param monthCode The month code in format "MMM-YY"
 * @returns Object with start and end dates for the month
 */
export function monthCodeToDates(monthCode: string): { start: Date, end: Date } {
  // Parse the month code (e.g., "Mar-24")
  const [monthStr, yearStr] = monthCode.split('-');
  const year = 2000 + parseInt(yearStr);
  
  // Get the month number (0-11)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = monthNames.findIndex(m => m === monthStr);
  
  if (monthIndex === -1) {
    throw new Error(`Invalid month code: ${monthCode}`);
  }
  
  // Create the start date (first day of month)
  const start = new Date(year, monthIndex, 1);
  
  // Create the end date (last day of month)
  const end = new Date(year, monthIndex + 1, 0);
  
  return { start, end };
}

/**
 * Calculate daily distribution from monthly distribution considering working days
 * @param monthlyDistribution The monthly distribution object
 * @returns Daily distribution object
 */
export function calculateDailyDistribution(
  monthlyDistribution: MonthlyDistribution
): DailyDistribution {
  const dailyDistribution: DailyDistribution = {};
  
  // Process each month in the distribution
  Object.entries(monthlyDistribution).forEach(([monthCode, totalValue]) => {
    try {
      // Convert month code to date range
      const { start, end } = monthCodeToDates(monthCode);
      
      // Count working days in the month
      const workingDaysInMonth = countWorkingDays(start, end);
      
      if (workingDaysInMonth === 0) {
        console.warn(`No working days found in month: ${monthCode}`);
        return;
      }
      
      // Calculate value per working day
      const valuePerDay = totalValue / workingDaysInMonth;
      
      // Distribute values to each working day in the month
      const currentDate = new Date(start);
      while (currentDate <= end) {
        if (!isWeekend(currentDate)) {
          const dateString = format(currentDate, 'yyyy-MM-dd');
          dailyDistribution[dateString] = valuePerDay;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.error(`Error processing month ${monthCode}:`, error);
    }
  });
  
  return dailyDistribution;
}

/**
 * Filter daily distribution by date range
 * @param dailyDistribution The daily distribution object
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @returns Filtered daily distribution
 */
export function filterDailyDistributionByDateRange(
  dailyDistribution: DailyDistribution,
  startDate: Date,
  endDate: Date
): DailyDistribution {
  const filteredDistribution: DailyDistribution = {};
  
  Object.entries(dailyDistribution).forEach(([dateString, value]) => {
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    
    if (isWithinInterval(date, { start: startDate, end: endDate })) {
      filteredDistribution[dateString] = value;
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
 * @returns Record of instruments and their daily distributions
 */
export function calculateDailyDistributionByInstrument(
  instrumentDistributions: Record<Instrument, MonthlyDistribution>
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  Object.entries(instrumentDistributions).forEach(([instrument, monthlyDist]) => {
    result[instrument] = calculateDailyDistribution(monthlyDist);
  });
  
  return result;
}

/**
 * Filter daily distributions by date range for all instruments
 * @param dailyDistributions Record of instruments and their daily distributions
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @returns Filtered daily distributions by instrument
 */
export function filterDailyDistributionsByDateRange(
  dailyDistributions: DailyDistributionByInstrument,
  startDate: Date,
  endDate: Date
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  Object.entries(dailyDistributions).forEach(([instrument, dailyDist]) => {
    result[instrument] = filterDailyDistributionByDateRange(dailyDist, startDate, endDate);
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
    result[instrument] = sumDailyDistribution(dailyDist);
  });
  
  return result as Record<Instrument, number>;
}

// Cache for daily distributions to optimize performance
const dailyDistributionCache = new Map<string, DailyDistribution>();

/**
 * Get or calculate daily distribution with caching
 * @param monthlyDistribution The monthly distribution object
 * @param cacheKey A unique key for caching (e.g., instrument name)
 * @returns Daily distribution object
 */
export function getCachedDailyDistribution(
  monthlyDistribution: MonthlyDistribution,
  cacheKey: string
): DailyDistribution {
  // Create a cache signature based on the monthly distribution and key
  const cacheSignature = `${cacheKey}:${JSON.stringify(monthlyDistribution)}`;
  
  // Check if we have a cached result
  if (dailyDistributionCache.has(cacheSignature)) {
    return dailyDistributionCache.get(cacheSignature)!;
  }
  
  // Calculate new distribution
  const dailyDistribution = calculateDailyDistribution(monthlyDistribution);
  
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
