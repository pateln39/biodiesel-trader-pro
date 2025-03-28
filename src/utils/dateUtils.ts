
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
