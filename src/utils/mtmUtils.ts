
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
