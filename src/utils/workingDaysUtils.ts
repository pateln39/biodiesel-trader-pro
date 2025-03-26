
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
 * Formats a date into a day code (e.g., "2024-03-15")
 * @param date The date to format
 * @returns The formatted day code
 */
export function formatDayCode(date: Date): string {
  return date.toISOString().split('T')[0];
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
    console.log("Invalid inputs for distribution:", { startDate, endDate, totalQuantity });
    return {};
  }
  
  // Calculate total working days
  const totalWorkingDays = countWorkingDays(startDate, endDate);
  if (totalWorkingDays === 0) {
    console.log("No working days found in the period:", { startDate, endDate });
    return {};
  }
  
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
      
      console.log(`Month ${monthCode}: ${workingDaysInMonth} working days, ${(proportion * 100).toFixed(2)}%, ${distribution[monthCode]} units`);
    }
    
    // Move to next month
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  console.log("Final distribution:", distribution);
  return distribution;
}

/**
 * Distributes a quantity across days based on working days in the pricing period
 * @param startDate The start date of the pricing period
 * @param endDate The end date of the pricing period
 * @param totalQuantity The total quantity to distribute
 * @returns An object mapping day codes (e.g., "2024-03-15") to their proportional quantities
 */
export function distributeQuantityByDays(
  startDate: Date, 
  endDate: Date, 
  totalQuantity: number
): Record<string, number> {
  // Validate inputs
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate || totalQuantity === 0) {
    console.log("Invalid inputs for daily distribution:", { startDate, endDate, totalQuantity });
    return {};
  }
  
  // Calculate total working days
  const totalWorkingDays = countWorkingDays(startDate, endDate);
  if (totalWorkingDays === 0) {
    console.log("No working days found in the period:", { startDate, endDate });
    return {};
  }
  
  const dailyDistribution: Record<string, number> = {};
  const dailyQuantity = totalQuantity / totalWorkingDays;
  
  // Iterate through each day in the range
  const current = new Date(startDate);
  while (current <= endDate) {
    if (!isWeekend(current)) {
      const dayCode = formatDayCode(current);
      dailyDistribution[dayCode] = parseFloat(dailyQuantity.toFixed(2));
    }
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  console.log("Daily distribution created:", Object.keys(dailyDistribution).length, "days");
  return dailyDistribution;
}

/**
 * Filters a daily distribution by date range
 * @param dailyDistribution The daily distribution to filter
 * @param startDate The start date of the filter range
 * @param endDate The end date of the filter range
 * @returns The filtered daily distribution containing only days within the range
 */
export function filterDailyDistributionByDateRange(
  dailyDistribution: Record<string, number>,
  startDate: Date,
  endDate: Date
): Record<string, number> {
  if (!dailyDistribution || Object.keys(dailyDistribution).length === 0) {
    return {};
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time components
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  const startIso = start.toISOString().split('T')[0];
  const endIso = end.toISOString().split('T')[0];
  
  // Filter the daily distribution
  const filtered: Record<string, number> = {};
  
  Object.entries(dailyDistribution).forEach(([dayCode, quantity]) => {
    if (dayCode >= startIso && dayCode <= endIso) {
      filtered[dayCode] = quantity;
    }
  });
  
  return filtered;
}

/**
 * Aggregates a daily distribution into monthly totals
 * @param dailyDistribution The daily distribution to aggregate
 * @returns An object mapping month codes to their total quantities
 */
export function aggregateDailyToMonthly(
  dailyDistribution: Record<string, number>
): Record<string, number> {
  if (!dailyDistribution || Object.keys(dailyDistribution).length === 0) {
    return {};
  }
  
  const monthlyTotals: Record<string, number> = {};
  
  Object.entries(dailyDistribution).forEach(([dayCode, quantity]) => {
    const [year, month] = dayCode.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthCode = formatMonthCode(date);
    
    if (!monthlyTotals[monthCode]) {
      monthlyTotals[monthCode] = 0;
    }
    
    monthlyTotals[monthCode] += quantity;
    // Round to 2 decimal places for consistency
    monthlyTotals[monthCode] = parseFloat(monthlyTotals[monthCode].toFixed(2));
  });
  
  return monthlyTotals;
}

/**
 * Extracts monthly or daily distribution data from formula exposures
 * @param exposures The exposures object from a formula
 * @param type The type of exposure to extract ('physical' or 'pricing')
 * @param distributionType The type of distribution to extract ('monthly' or 'daily')
 * @returns An object with product keys and their distributions
 */
export function getDistribution(
  exposures: any,
  type: 'physical' | 'pricing', 
  distributionType: 'monthly' | 'daily' = 'monthly'
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  
  if (!exposures) {
    return result;
  }
  
  // Check for the specified distribution type
  if (distributionType === 'daily' && exposures.dailyDistribution && typeof exposures.dailyDistribution === 'object') {
    return exposures.dailyDistribution;
  } else if (distributionType === 'monthly' && exposures.monthlyDistribution && typeof exposures.monthlyDistribution === 'object') {
    return exposures.monthlyDistribution;
  }
  
  // If no distribution is found but we have the specific exposure type
  if (exposures[type] && typeof exposures[type] === 'object') {
    // No distribution data, but we have exposure data
    // This will be handled by the caller based on pricing period dates
    return result;
  }
  
  return result;
}

/**
 * Extracts monthly distribution data from formula exposures (backwards compatibility)
 * @param exposures The exposures object from a formula
 * @param type The type of exposure to extract ('physical' or 'pricing')
 * @returns An object with product keys and their monthly distributions
 */
export function getMonthlyDistribution(
  exposures: any,
  type: 'physical' | 'pricing'
): Record<string, Record<string, number>> {
  return getDistribution(exposures, type, 'monthly');
}

/**
 * Extracts daily distribution data from formula exposures
 * @param exposures The exposures object from a formula
 * @param type The type of exposure to extract ('physical' or 'pricing')
 * @returns An object with product keys and their daily distributions
 */
export function getDailyDistribution(
  exposures: any,
  type: 'physical' | 'pricing'
): Record<string, Record<string, number>> {
  return getDistribution(exposures, type, 'daily');
}
