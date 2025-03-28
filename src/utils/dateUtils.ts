
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
 * Checks if a date is a weekend (Saturday or Sunday)
 * 
 * @param date The date to check
 * @returns True if the date is a weekend day
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

/**
 * Checks if a date is a business day (not a weekend)
 * 
 * @param date The date to check
 * @returns True if the date is a business day
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * Gets the number of business days between two dates, inclusive of start and end dates
 * 
 * @param startDate The start date
 * @param endDate The end date
 * @returns Number of business days between the two dates
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  // Ensure startDate is earlier than endDate
  if (startDate > endDate) {
    return 0;
  }
  
  let count = 0;
  const currentDate = new Date(startDate);
  
  // Set to midnight to avoid time comparison issues
  currentDate.setHours(0, 0, 0, 0);
  const targetEndDate = new Date(endDate);
  targetEndDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= targetEndDate) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Gets the first and last day of the month for a given month code (MMM-YY)
 * 
 * @param monthCode The month code in format MMM-YY (e.g., "Mar-24")
 * @returns Object with firstDay and lastDay Date objects
 */
export function getMonthBoundaries(monthCode: string): { firstDay: Date, lastDay: Date } {
  const [month, yearShort] = monthCode.split('-');
  const year = 2000 + parseInt(yearShort);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = monthNames.findIndex(m => m === month);
  
  if (monthIndex === -1) {
    throw new Error(`Invalid month code: ${monthCode}`);
  }
  
  // First day of the month
  const firstDay = new Date(year, monthIndex, 1);
  
  // Last day of the month (first day of next month - 1)
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  return { firstDay, lastDay };
}

/**
 * Calculate the proportion of business days in a specific month compared to
 * the total business days in a date range
 * 
 * @param startDate Overall start date of the date range
 * @param endDate Overall end date of the date range
 * @param monthCode The month to calculate proportion for (format: MMM-YY)
 * @returns Proportion of business days (0-1) in the specified month
 */
export function getBusinessDaysProportion(
  startDate: Date, 
  endDate: Date, 
  monthCode: string
): number {
  try {
    // Get the month boundaries
    const { firstDay, lastDay } = getMonthBoundaries(monthCode);
    
    // Ensure dates are set to midnight
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    // Calculate overlap period between the month and the date range
    const overlapStart = new Date(Math.max(start.getTime(), firstDay.getTime()));
    const overlapEnd = new Date(Math.min(end.getTime(), lastDay.getTime()));
    
    // If no overlap, return 0
    if (overlapStart > overlapEnd) {
      return 0;
    }
    
    // Count business days in the overlap period and in the entire date range
    const businessDaysInOverlap = getBusinessDaysBetween(overlapStart, overlapEnd);
    const totalBusinessDays = getBusinessDaysBetween(start, end);
    
    // Calculate the proportion (avoid division by zero)
    return totalBusinessDays > 0 ? businessDaysInOverlap / totalBusinessDays : 0;
  } catch (e) {
    console.error('Error calculating business days proportion:', e);
    return 0;
  }
}
