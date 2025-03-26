
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
    console.warn(`Invalid date range: ${start} to ${end}`);
    return 0;
  }
  
  let count = 0;
  const current = new Date(start);
  const workingDays: string[] = [];
  
  // Count each day between start and end (inclusive)
  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
      workingDays.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  
  // Log detailed information about the calculation
  console.log(`Working days from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}: ${count}`);
  console.log(`Working days: ${workingDays.join(', ')}`);
  
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
    console.log("Invalid inputs for distribution:", { startDate, endDate, totalQuantity });
    return {};
  }
  
  // Log initial date range and quantity for debugging
  console.log(`Distributing quantity ${totalQuantity} for period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
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
  
  // Make sure we iterate through ALL months in the range including the last month
  // Create a deep copy of firstMonth to avoid modifying it
  const currentMonth = new Date(firstMonth);
  
  // Ensure we cover the entire range by checking <= lastMonth
  while (currentMonth <= lastMonth) {
    // Calculate month's start and end dates
    const monthStart = new Date(currentMonth);
    // Last day of month - important to get the correct last day
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Adjust for pricing period boundaries
    const effectiveStart = startDate > monthStart ? startDate : monthStart;
    const effectiveEnd = endDate < monthEnd ? endDate : monthEnd;
    
    // Log the effective date range for this month
    console.log(`Month ${formatMonthCode(currentMonth)} date range: ${effectiveStart.toISOString().split('T')[0]} to ${effectiveEnd.toISOString().split('T')[0]}`);
    
    // Count working days in this month's portion of the pricing period
    const workingDaysInMonth = countWorkingDays(effectiveStart, effectiveEnd);
    
    // Calculate proportion of the total quantity for this month
    if (workingDaysInMonth > 0) {
      const monthCode = formatMonthCode(currentMonth);
      const proportion = workingDaysInMonth / totalWorkingDays;
      distribution[monthCode] = parseFloat((proportion * totalQuantity).toFixed(2));
      
      console.log(`Month ${monthCode}: ${workingDaysInMonth} working days, ${(proportion * 100).toFixed(2)}%, ${distribution[monthCode]} units`);
    }
    
    // Move to next month - ensure we actually increment to avoid infinite loops
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  console.log("Final distribution:", distribution);
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
  // Make sure there is a hyphen between month and year
  return `${monthCode}-${yearCode}`;
}

/**
 * Parses a month code string into a standard format (e.g. "Mar 24" -> "Mar-24")
 * @param monthCode The month code to parse
 * @returns Standardized month code
 */
export function standardizeMonthCode(monthCode: string): string {
  // If already contains a hyphen, return as is
  if (monthCode.includes('-')) {
    return monthCode;
  }
  
  // Handle "Mar 24" format (with space)
  if (monthCode.includes(' ')) {
    const [month, year] = monthCode.split(' ');
    return `${month}-${year}`;
  }
  
  // Try to extract month and year if in another format
  const monthPattern = /([A-Za-z]{3})(\d{2})/;
  const match = monthCode.match(monthPattern);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  
  console.warn(`Unable to standardize month code: ${monthCode}`);
  return monthCode;
}

/**
 * Extracts monthly distribution data from formula exposures
 * @param exposures The exposures object from a formula
 * @param type The type of exposure to extract ('physical' or 'pricing')
 * @returns An object with product keys and their monthly distributions
 */
export function getMonthlyDistribution(
  exposures: any,
  type: 'physical' | 'pricing'
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  
  if (!exposures) {
    console.log("No exposures provided to getMonthlyDistribution");
    return result;
  }
  
  // First check if there's a dedicated monthlyDistribution field
  if (exposures.monthlyDistribution && typeof exposures.monthlyDistribution === 'object') {
    // Standardize month codes in the distribution
    const standardized: Record<string, Record<string, number>> = {};
    
    Object.entries(exposures.monthlyDistribution).forEach(([instrument, distribution]) => {
      standardized[instrument] = {};
      
      // Convert each month code to standard format
      Object.entries(distribution as Record<string, number>).forEach(([monthCode, value]) => {
        const standardMonthCode = standardizeMonthCode(monthCode);
        standardized[instrument][standardMonthCode] = value;
      });
    });
    
    console.log("Using explicit monthly distribution with standardized month codes:", standardized);
    return standardized;
  }
  
  // If no monthly distribution is found but we have the specific exposure type
  if (exposures[type] && typeof exposures[type] === 'object') {
    console.log(`Found ${type} exposures but no explicit monthly distribution`);
    // This will be handled by the caller based on pricing period dates
  }
  
  return result;
}

/**
 * Adds helper method to get working days in a month for debugging
 * @param year The year
 * @param month The month (0-based, 0 = January)
 * @returns Number of working days in the month
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month
  
  console.log(`Calculating working days for ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
  return countWorkingDays(startDate, endDate);
}

