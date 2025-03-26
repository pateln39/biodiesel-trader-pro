
/**
 * Utility functions for working days calculations
 */

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 * @param date The date to check
 * @returns True if the date is a weekend day
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

/**
 * Counts the number of working days (Monday-Friday) between two dates, inclusive
 * @param startDate The start date
 * @param endDate The end date
 * @returns The number of working days
 */
export function countWorkingDays(startDate: Date, endDate: Date): number {
  // Ensure we're working with date objects
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time component to compare only dates
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // If dates are invalid or end is before start, return 0
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }
  
  let count = 0;
  const current = new Date(start);
  
  // Count each day between start and end (inclusive)
  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Distributes a quantity across months based on working days in the pricing period
 * @param startDate The start date of the pricing period
 * @param endDate The end date of the pricing period
 * @param totalQuantity The total quantity to distribute
 * @returns An object mapping month codes (e.g., "Mar-24") to their proportional quantities
 */
export function distributeQuantityByWorkingDays(
  startDate: Date, 
  endDate: Date, 
  totalQuantity: number
): Record<string, number> {
  // Validate inputs
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate || totalQuantity === 0) {
    return {};
  }
  
  // Calculate total working days
  const totalWorkingDays = countWorkingDays(startDate, endDate);
  if (totalWorkingDays === 0) return {};
  
  const distribution: Record<string, number> = {};
  
  // Get the first and last month in the range
  const firstMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  // Iterate through each month in the pricing period
  const currentMonth = new Date(firstMonth);
  while (currentMonth <= lastMonth) {
    // Calculate month's start and end dates
    const monthStart = new Date(currentMonth);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0); // Last day of month
    
    // Adjust for pricing period boundaries
    const effectiveStart = startDate > monthStart ? startDate : monthStart;
    const effectiveEnd = endDate < monthEnd ? endDate : monthEnd;
    
    // Count working days in this month's portion of the pricing period
    const workingDaysInMonth = countWorkingDays(effectiveStart, effectiveEnd);
    
    // Calculate proportion of the total quantity for this month
    if (workingDaysInMonth > 0) {
      const monthCode = formatMonthCode(currentMonth);
      const proportion = workingDaysInMonth / totalWorkingDays;
      distribution[monthCode] = parseFloat((proportion * totalQuantity).toFixed(2));
    }
    
    // Move to next month
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  return distribution;
}

/**
 * Formats a date into a month code (e.g., "Mar-24")
 * @param date The date to format
 * @returns The formatted month code
 */
export function formatMonthCode(date: Date): string {
  const monthCode = date.toLocaleDateString('en-US', { month: 'short' });
  const yearCode = date.getFullYear().toString().slice(2);
  return `${monthCode}-${yearCode}`;
}

/**
 * Extract monthly distribution from formula exposures
 * @param exposures The exposures object from a pricing formula
 * @param type The type of exposure ('physical' or 'pricing')
 * @returns An object mapping instruments to their monthly distributions
 */
export function getMonthlyDistribution(
  exposures: any,
  type: 'physical' | 'pricing'
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  
  // Return empty result if exposures is undefined or not an object
  if (!exposures || typeof exposures !== 'object') {
    return result;
  }
  
  // Check if exposures has monthlyDistribution property
  if (exposures.monthlyDistribution && typeof exposures.monthlyDistribution === 'object') {
    // Handle the case where monthlyDistribution is directly nested under exposures
    Object.entries(exposures.monthlyDistribution).forEach(([instrument, monthDistribution]) => {
      if (typeof monthDistribution === 'object') {
        result[instrument] = { ...monthDistribution as Record<string, number> };
      }
    });
    
    return result;
  }
  
  // Check if we need to look in the physical or pricing property of exposures
  const typeExposures = exposures[type];
  
  // If there's no specific type exposures, return empty result
  if (!typeExposures || typeof typeExposures !== 'object') {
    return result;
  }
  
  // Check if there's a nested monthlyDistribution under the type
  if (typeExposures.monthlyDistribution && typeof typeExposures.monthlyDistribution === 'object') {
    Object.entries(typeExposures.monthlyDistribution).forEach(([instrument, monthDistribution]) => {
      if (typeof monthDistribution === 'object') {
        result[instrument] = { ...monthDistribution as Record<string, number> };
      }
    });
  }
  
  return result;
}
