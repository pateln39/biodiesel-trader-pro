
/**
 * Utility functions for date operations
 */

/**
 * Generates an array of month codes for the next N months starting from the current month
 * Format: MMM-YY (e.g., "Mar-24")
 * 
 * @param count Number of months to generate
 * @returns Array of month codes
 */
export function getNextMonths(count: number = 13): string[] {
  const months = [];
  const currentDate = new Date();
  
  // Start with current month
  for (let i = 0; i < count; i++) {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    
    // Format as MMM-YY (e.g., "Mar-24")
    const monthCode = targetDate.toLocaleDateString('en-US', { 
      month: 'short'
    });
    
    const yearCode = targetDate.getFullYear().toString().slice(2);
    months.push(`${monthCode}-${yearCode}`);
  }
  
  return months;
}

/**
 * Formats a date into a month code (MMM-YY)
 * 
 * @param date The date to format
 * @returns Formatted month code
 */
export function formatMonthCode(date: Date): string {
  const monthCode = date.toLocaleDateString('en-US', { month: 'short' });
  const yearCode = date.getFullYear().toString().slice(2);
  return `${monthCode}-${yearCode}`;
}

/**
 * Checks if a period code is valid and is in the future (or current month)
 * 
 * @param periodCode The period code to check
 * @returns True if period is valid and not in the past
 */
export function isValidFuturePeriod(periodCode: string): boolean {
  try {
    // Parse the period code (e.g., "Mar-24")
    const [month, yearShort] = periodCode.split('-');
    const year = 2000 + parseInt(yearShort);
    
    // Get the month number (0-11)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.findIndex(m => m === month);
    
    if (monthIndex === -1) return false;
    
    // Create Date objects
    const periodDate = new Date(year, monthIndex, 1);
    const currentDate = new Date();
    const currentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    
    // Check if the period is current month or future
    return periodDate >= currentMonth;
  } catch (e) {
    return false;
  }
}

/**
 * Format a date as YYYY-MM-DD for database storage,
 * preserving the date exactly as it appears in the UI without timezone adjustments
 * 
 * @param date The date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForStorage(date: Date): string {
  // Extract the year, month, and day using local date methods to prevent timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date is a business day (Monday-Friday)
 * @param date The date to check
 * @returns True if the date is a business day
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Counts business days between two dates, inclusive
 * @param startDate Start date (inclusive)
 * @param endDate End date (inclusive)
 * @returns Number of business days
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Groups business days by month for a given date range
 * @param startDate Start date of the range (inclusive)
 * @param endDate End date of the range (inclusive)
 * @returns Object with month codes as keys and business day counts as values
 */
export function getBusinessDaysByMonth(startDate: Date, endDate: Date): Record<string, number> {
  const result: Record<string, number> = {};
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      const monthCode = formatMonthCode(currentDate);
      
      if (!result[monthCode]) {
        result[monthCode] = 0;
      }
      
      result[monthCode]++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Rounds a number to the nearest integer while preserving the sign
 * @param value The number to round
 * @returns Rounded integer with preserved sign
 */
export function roundWithSign(value: number): number {
  return value >= 0 ? Math.round(value) : -Math.round(Math.abs(value));
}

/**
 * Splits a value proportionally across months based on business day distribution,
 * ensuring the total remains the same after rounding
 * @param value The value to distribute
 * @param businessDaysByMonth Business days per month
 * @returns Distribution of the value by month
 */
export function distributeValueByBusinessDays(
  value: number,
  businessDaysByMonth: Record<string, number>
): Record<string, number> {
  const totalBusinessDays = Object.values(businessDaysByMonth).reduce((sum, days) => sum + days, 0);
  
  if (totalBusinessDays === 0) {
    return {};
  }
  
  const distribution: Record<string, number> = {};
  let remainingValue = value;
  let processedMonths = 0;
  const totalMonths = Object.keys(businessDaysByMonth).length;
  
  // Sort months chronologically to ensure consistent distribution
  const sortedMonths = Object.keys(businessDaysByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');
    return (parseInt(yearA) * 100 + getMonthIndex(monthA)) - (parseInt(yearB) * 100 + getMonthIndex(monthB));
  });
  
  for (const month of sortedMonths) {
    processedMonths++;
    const businessDays = businessDaysByMonth[month];
    const proportion = businessDays / totalBusinessDays;
    
    // For the last month, use the remaining value to ensure the total matches exactly
    if (processedMonths === totalMonths) {
      distribution[month] = remainingValue;
    } else {
      const monthValue = value * proportion;
      const roundedValue = roundWithSign(monthValue);
      distribution[month] = roundedValue;
      remainingValue -= roundedValue;
    }
  }
  
  return distribution;
}

/**
 * Helper function to get month index from month code
 * @param monthCode Three-letter month code (e.g., "Jan")
 * @returns Month index (0-11)
 */
function getMonthIndex(monthCode: string): number {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.indexOf(monthCode);
}
