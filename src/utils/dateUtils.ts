
import { format, parse, isValid, addMonths, subMonths, isWeekend, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';

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
 * Format a date for display in a more standard format (YYYY-MM-DD)
 * @param date Date object or ISO string
 * @returns Formatted date string or '-' if invalid
 */
export const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '-';
  
  return format(dateObj, 'yyyy-MM-dd');
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
 * Get an array of month codes for a specified number of months
 * @param numMonths Number of future months to return (including current)
 * @returns Array of month codes (e.g. ["May-23", "Jun-23", ...])
 */
export const getNextMonths = (numMonths: number = 12): string[] => {
  const months: string[] = [];
  const currentDate = new Date();
  
  // Set to first day of the current month to ensure consistency
  currentDate.setDate(1);
  
  for (let i = 0; i < numMonths; i++) {
    // For the first month (i=0), we use the current month
    const monthDate = i === 0 ? currentDate : addMonths(currentDate, i);
    months.push(formatMonthCode(monthDate));
  }
  
  return months;
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

/**
 * Check if a date is a business day (not a weekend)
 * @param date Date to check
 * @returns Boolean indicating if date is a business day
 */
export const isBusinessDay = (date: Date): boolean => {
  // Not considering holidays, only weekends
  return !isWeekend(date);
};

/**
 * Count business days between two dates
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @returns Number of business days
 */
export const countBusinessDays = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize dates to beginning of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Get all days in the interval
  const days = eachDayOfInterval({ start, end });
  
  // Count business days
  return days.filter(day => isBusinessDay(day)).length;
};

/**
 * Get a mapping of month codes to business days in each month
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @returns Record with month codes as keys and business day counts as values
 */
export const getBusinessDaysByMonth = (
  startDate: Date,
  endDate: Date
): Record<string, number> => {
  const result: Record<string, number> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize dates to beginning of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  // Get all month codes in the range
  const monthCodes = getMonthCodesBetweenDates(start, end);
  
  monthCodes.forEach(monthCode => {
    // Get start and end dates for this month
    const monthDates = getMonthDates(monthCode);
    if (!monthDates) {
      result[monthCode] = 0;
      return;
    }
    
    // Determine overlap with the overall date range
    const monthStart = new Date(Math.max(monthDates.startDate.getTime(), start.getTime()));
    const monthEnd = new Date(Math.min(monthDates.endDate.getTime(), end.getTime()));
    
    // Count business days in the overlapping period
    result[monthCode] = countBusinessDays(monthStart, monthEnd);
  });
  
  return result;
};

/**
 * Distribute a value proportionally across months based on business days
 * @param totalValue Total value to distribute
 * @param businessDaysByMonth Record with month codes as keys and business day counts as values
 * @returns Record with month codes as keys and distributed values
 */
export const distributeValueByBusinessDays = (
  totalValue: number,
  businessDaysByMonth: Record<string, number>
): Record<string, number> => {
  const result: Record<string, number> = {};
  
  // Calculate total business days
  const totalBusinessDays = Object.values(businessDaysByMonth).reduce((sum, days) => sum + days, 0);
  
  // Handle edge case of no business days
  if (totalBusinessDays === 0) {
    Object.keys(businessDaysByMonth).forEach(monthCode => {
      result[monthCode] = 0;
    });
    return result;
  }
  
  // Distribute value proportionally
  Object.entries(businessDaysByMonth).forEach(([monthCode, days]) => {
    result[monthCode] = (days / totalBusinessDays) * totalValue;
  });
  
  return result;
};

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

