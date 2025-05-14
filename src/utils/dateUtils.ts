import { format, parse, isValid, addMonths, subMonths } from 'date-fns';

/**
 * Format a date as a month code (e.g., "Jan-23")
 */
export const formatMonthCode = (date: Date): string => {
  return format(date, 'MMM-yy');
};

/**
 * Parse a month code (e.g., "Jan-23") into a Date object
 */
export const parseMonthCode = (monthCode: string): Date | null => {
  try {
    const date = parse(monthCode, 'MMM-yy', new Date());
    return isValid(date) ? date : null;
  } catch (error) {
    console.error(`Error parsing month code: ${monthCode}`, error);
    return null;
  }
};

/**
 * Format a date for storage in the database (YYYY-MM-DD)
 */
export const formatDateForStorage = (date: Date | null): string | null => {
  if (!date || !isValid(date)) return null;
  return format(date, 'yyyy-MM-dd');
};

/**
 * Format a date for display (DD/MM/YYYY)
 */
export const formatDateForDisplay = (date: Date | null): string => {
  if (!date || !isValid(date)) return '-';
  return format(date, 'dd/MM/yyyy');
};

/**
 * Get the previous month from a given date
 */
export const getPreviousMonth = (date: Date): Date => {
  return subMonths(date, 1);
};

/**
 * Get the next month from a given date
 */
export const getNextMonth = (date: Date): Date => {
  return addMonths(date, 1);
};

/**
 * Parse an ISO date string to a Date object, handling timezone differences
 * @param dateStr Date string in ISO format (YYYY-MM-DD)
 * @returns Date object representing the date
 */
export const parseISODate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Check if we have just a date part (YYYY-MM-DD) without time
  // If so, create a date at midnight local time to ensure filtering works correctly
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Month is 0-indexed in JavaScript Date
    return new Date(year, month - 1, day);
  }
  
  // Otherwise parse as is (ISO string)
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn(`[DATE] Invalid date string: ${dateStr}`);
      return null;
    }
    return date;
  } catch (err) {
    console.error(`[DATE] Error parsing date: ${dateStr}`, err);
    return null;
  }
};

/**
 * Check if a date is within a specified range (inclusive)
 * @param date Date to check
 * @param rangeStart Start date of the range
 * @param rangeEnd End date of the range
 * @returns Boolean indicating if date is in range
 */
export const isDateInRange = (date: Date, rangeStart: Date, rangeEnd: Date): boolean => {
  // Normalize all dates to midnight for consistent comparison
  const normalizeDate = (d: Date): Date => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };
  
  const normalizedDate = normalizeDate(date);
  const normalizedStart = normalizeDate(rangeStart);
  const normalizedEnd = normalizeDate(rangeEnd);
  
  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
};

/**
 * Get all month codes between two dates (inclusive)
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @returns Array of month codes in format "MMM-YY"
 */
export const getMonthCodesBetweenDates = (startDate: Date, endDate: Date): string[] => {
  const months: string[] = [];
  const currentDate = new Date(startDate);
  
  // Reset day to first of month to ensure we get full months
  currentDate.setDate(1);
  
  // Clone end date and set to last day of its month
  const monthEndDate = new Date(endDate);
  monthEndDate.setDate(1); // First set to 1st
  monthEndDate.setMonth(monthEndDate.getMonth() + 1); // Move to next month
  monthEndDate.setDate(0); // Set to last day of previous month
  
  // Loop through all months in the range
  while (currentDate <= monthEndDate) {
    months.push(formatMonthCode(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
};

/**
 * Get an array of month codes for a specified number of months
 * starting from a given date
 */
export const getMonthCodesForPeriod = (startDate: Date, numMonths: number): string[] => {
  const months: string[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < numMonths; i++) {
    months.push(formatMonthCode(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
};

/**
 * Get the current month code
 */
export const getCurrentMonthCode = (): string => {
  return formatMonthCode(new Date());
};

/**
 * Get month codes for a range of months around the current date
 */
export const getMonthCodesAroundCurrent = (
  monthsBefore: number = 3,
  monthsAfter: number = 12
): string[] => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - monthsBefore);
  
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + monthsAfter);
  
  return getMonthCodesBetweenDates(startDate, endDate);
};
