
import { addMonths, format } from 'date-fns';

/**
 * Get an array of the next N months from a given date
 * @param startDate The date to start from
 * @param count The number of months to generate
 * @returns Array of date objects for the next N months
 */
export function getNextMonths(startDate: Date = new Date(), count: number = 12): Date[] {
  const months = [];
  
  for (let i = 0; i < count; i++) {
    months.push(addMonths(startDate, i));
  }
  
  return months;
}

/**
 * Format a date to a standard display format
 * @param date The date to format
 * @param formatString The format string to use (defaults to MM/dd/yyyy)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | undefined, formatString: string = 'MM/dd/yyyy'): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Check if a date is valid
 * @param date The date to check
 * @returns True if the date is valid
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Get the beginning of the current month
 * @returns Date object for the first day of the current month
 */
export function getStartOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Get the end of the current month
 * @returns Date object for the last day of the current month
 */
export function getEndOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}
