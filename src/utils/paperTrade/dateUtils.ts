
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
