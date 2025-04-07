
import { formatMonthCode } from './dateUtils';

/**
 * Check if a date range is entirely in the future
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @returns Boolean indicating if the entire range is in the future
 */
export function isDateRangeInFuture(startDate: Date, endDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return startDate >= today && endDate >= today;
}

/**
 * Extract all months spanned by a date range
 * @param startDate Start date of the range
 * @param endDate End date of the range 
 * @returns Array of month codes in the format "MMM-YY" (e.g., "Apr-25")
 */
export function getMonthsInDateRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const currentDate = new Date(startDate);
  
  // Set to first day of the month to avoid issues with month calculations
  currentDate.setDate(1);
  
  // Create endpoint date (first day of the month after the end date)
  const endPoint = new Date(endDate);
  endPoint.setDate(1);
  
  // Loop through each month in the range
  while (currentDate <= endPoint) {
    months.push(formatMonthCode(currentDate));
    
    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
}

/**
 * Get the default MTM future month based on the start date of the range
 * @param startDate Start date of the range
 * @returns Month code in the format "MMM-YY"
 */
export function getDefaultMtmFutureMonth(startDate: Date): string {
  return formatMonthCode(startDate);
}

/**
 * Parse month code into a database date format for use in queries
 * @param monthCode Month code in the format "MMM-YY" (e.g., "Apr-25")
 * @returns Date string in format "YYYY-MM-01"
 */
export function parseMonthCodeToDbDate(monthCode: string): string {
  // Extract month name and year from the code
  const [monthName, yearStr] = monthCode.split('-');
  
  // Map month names to their numeric values (0-11)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = monthNames.findIndex(m => m === monthName);
  
  if (monthIndex === -1) {
    console.error(`Invalid month name in code: ${monthCode}`);
    return '';
  }
  
  // Convert 2-digit year to full year (assuming 20xx for now)
  const fullYear = 2000 + parseInt(yearStr);
  
  // Format as YYYY-MM-01 (first day of month for database queries)
  const month = (monthIndex + 1).toString().padStart(2, '0');
  
  return `${fullYear}-${month}-01`;
}

/**
 * Convert a month code to a JavaScript Date object
 * @param monthCode Month code in format "MMM-YY" (e.g., "Apr-25")
 * @returns A Date object representing the first day of that month
 */
export function monthCodeToDate(monthCode: string): Date | null {
  try {
    const dbDateStr = parseMonthCodeToDbDate(monthCode);
    if (!dbDateStr) return null;
    
    return new Date(dbDateStr);
  } catch (error) {
    console.error(`Error converting month code ${monthCode} to date:`, error);
    return null;
  }
}

/**
 * Check if a string is a valid month code
 * @param str String to check
 * @returns Boolean indicating if the string is a valid month code
 */
export function isValidMonthCode(str: string): boolean {
  if (!str) return false;
  
  const monthCodePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/;
  return monthCodePattern.test(str);
}

/**
 * Format a date as a month code string
 * @param date Date to format
 * @returns Month code in format "MMM-YY" (e.g., "Apr-25")
 */
export function formatAsMonthCode(date: Date): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().substring(2);
  return `${month}-${year}`;
}

/**
 * Get the next month code after the given month code
 * @param monthCode Current month code in format "MMM-YY"
 * @returns Next month code in format "MMM-YY"
 */
export function getNextMonthCode(monthCode: string): string | null {
  const date = monthCodeToDate(monthCode);
  if (!date) return null;
  
  date.setMonth(date.getMonth() + 1);
  return formatAsMonthCode(date);
}
