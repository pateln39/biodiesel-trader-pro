
/**
 * Get start and end dates for a given month code (e.g., "Mar-23")
 * @param monthCode Month code in format "MMM-YY"
 * @returns Object with startDate and endDate, or null if invalid format
 */
export function getMonthDates(monthCode: string): { startDate: Date; endDate: Date } | null {
  // Parse the month code (e.g., "Mar-23")
  const parts = monthCode.split('-');
  if (parts.length !== 2) return null;
  
  const monthStr = parts[0];
  const yearStr = parts[1];
  
  // Map month abbreviation to month number (0-based)
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const month = monthMap[monthStr];
  if (month === undefined) return null;
  
  // Parse year (assuming 20xx for two-digit years)
  const year = 2000 + parseInt(yearStr, 10);
  if (isNaN(year)) return null;
  
  // Create start date (first day of month)
  const startDate = new Date(year, month, 1);
  
  // Create end date (last day of month)
  // By setting day to 0 of next month, we get the last day of the current month
  const endDate = new Date(year, month + 1, 0);
  
  return { startDate, endDate };
}

/**
 * Determines if a period is in the past, present, or future relative to a reference date
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 * @param referenceDate - Date to compare against (default: current date)
 * @returns 'past', 'current', or 'future'
 */
export function getPeriodType(
  startDate: Date,
  endDate: Date,
  referenceDate: Date = new Date()
): 'past' | 'current' | 'future' {
  // Normalize reference date to remove time component
  const normalizedRefDate = new Date(referenceDate);
  normalizedRefDate.setHours(0, 0, 0, 0);
  
  // Normalize start and end dates to remove time component
  const normalizedStartDate = new Date(startDate);
  normalizedStartDate.setHours(0, 0, 0, 0);
  
  const normalizedEndDate = new Date(endDate);
  normalizedEndDate.setHours(23, 59, 59, 999);
  
  // Determine period type
  if (normalizedEndDate < normalizedRefDate) {
    return 'past';
  } else if (normalizedStartDate > normalizedRefDate) {
    return 'future';
  } else {
    return 'current';
  }
}

/**
 * Format a date for database storage without timezone issues
 * Uses YYYY-MM-DD format and ensures the day is not off by one due to timezone conversion
 * 
 * @param date The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDatabase(date: Date): string {
  // Get the year, month, and day components directly (no timezone conversion)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  // Return in YYYY-MM-DD format
  return `${year}-${month}-${day}`;
}
