/**
 * Formats a Date object into a string with the format "MMM-YY" (e.g., "Dec-24").
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string.
 */
export const formatMonthCode = (date: Date): string => {
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
};

/**
 * Formats a Date object into a string with the format "YYYY-MM-DD" (e.g., "2024-12-25").
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string.
 */
export const formatDateForStorage = (date: Date | null): string | null => {
  if (!date) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse ISO date string to Date object
 */
export const parseISODate = (dateString: string): Date => {
  try {
    // Handle both full ISO strings and date-only strings
    if (dateString.includes('T')) {
      return new Date(dateString);
    } else {
      // If it's just a date string (YYYY-MM-DD), make sure we create the date correctly
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed in JS Date
    }
  } catch (error) {
    console.error('Error parsing ISO date:', error);
    return new Date(); // Return current date as fallback
  }
};

/**
 * Check if a date is within a given range (inclusive)
 */
export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  // Set all dates to midnight for consistent comparison
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(0, 0, 0, 0);
  
  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
};

/**
 * Check if a month overlaps with a date range
 */
export const doesMonthOverlapRange = (monthCode: string, startDate: Date, endDate: Date): boolean => {
  // Parse month code (e.g., "May-24")
  const [monthName, yearStr] = monthCode.split('-');
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    .findIndex(m => m === monthName);
  
  if (monthIndex === -1 || !yearStr) {
    console.error('Invalid month code format:', monthCode);
    return false;
  }
  
  const year = 2000 + parseInt(yearStr);
  
  // Create date range for the month
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0); // Last day of month
  
  // Check if ranges overlap
  return (
    (monthStart <= endDate && monthEnd >= startDate) ||
    (startDate <= monthEnd && endDate >= monthStart)
  );
};
