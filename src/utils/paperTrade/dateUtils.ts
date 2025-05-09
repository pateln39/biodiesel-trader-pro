import { MonthDates } from './mtmTypes';

/**
 * Get the start and end date for a month period (MMM-YY)
 * @param period - Period string in format MMM-YY (e.g., Jan-25)
 * @returns Object containing startDate and endDate or null if invalid
 */
export const getMonthDates = (period: string): MonthDates | null => {
  if (!period) return null;
  
  try {
    const [month, yearStr] = period.split('-');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      .findIndex(m => m === month);
      
    if (monthIndex === -1 || !yearStr) return null;
    
    const year = 2000 + parseInt(yearStr);
    const startDate = new Date(year, monthIndex, 1);
    
    // Calculate the last day of the month
    const endDate = new Date(year, monthIndex + 1, 0);
    
    return { startDate, endDate };
  } catch (error) {
    console.error('Error parsing period:', error);
    return null;
  }
};

/**
 * Check if a date range is in the past, current, or future
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 * @param today - Reference date (defaults to current date)
 * @returns Type of the period ('past', 'current', or 'future')
 */
export const getPeriodType = (
  startDate: Date, 
  endDate: Date, 
  today: Date = new Date()
): 'past' | 'current' | 'future' => {
  // Set time to beginning of the day for consistent comparison
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  
  // If end date is before today, it's in the past
  if (endDate < todayStart) {
    return 'past';
  }
  
  // If start date is after today, it's in the future
  if (startDate > todayStart) {
    return 'future';
  }
  
  // Otherwise, it's the current period
  return 'current';
};
