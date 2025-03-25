
/**
 * Utility functions for business day calculations
 */

/**
 * Checks if a date is a business day (Monday-Friday)
 * 
 * @param date The date to check
 * @returns True if the date is a business day
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
}

/**
 * Counts the number of business days between two dates (inclusive)
 * 
 * @param startDate The start date (inclusive)
 * @param endDate The end date (inclusive)
 * @returns The number of business days
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  // Set start date to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Calculates business days in each month for a date range
 * 
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @returns An object with month codes as keys and business day counts as values
 */
export function calculateBusinessDaysByMonth(startDate: Date, endDate: Date): Record<string, number> {
  const result: Record<string, number> = {};
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      const monthKey = currentDate.toLocaleDateString('en-US', { 
        month: 'short',
        year: '2-digit'
      });
      
      if (!result[monthKey]) {
        result[monthKey] = 0;
      }
      
      result[monthKey]++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Calculates pro-rated exposure allocation by month based on business days
 * 
 * @param startDate The start date of the pricing period
 * @param endDate The end date of the pricing period
 * @param totalExposure The total exposure amount
 * @returns An object with month codes as keys and allocated exposure amounts as values
 */
export function calculateProRatedExposure(
  startDate: Date,
  endDate: Date,
  totalExposure: number
): Record<string, number> {
  // Added debugging info
  console.log(`Calculating pro-rated exposure for period: ${startDate.toISOString()} to ${endDate.toISOString()}, exposure: ${totalExposure}`);
  
  const businessDaysByMonth = calculateBusinessDaysByMonth(startDate, endDate);
  const totalBusinessDays = Object.values(businessDaysByMonth).reduce((sum, days) => sum + days, 0);
  
  console.log('Business days by month:', businessDaysByMonth);
  console.log('Total business days:', totalBusinessDays);
  
  // If there are no business days, return empty object
  if (totalBusinessDays === 0) {
    console.log('No business days found in period');
    return {};
  }
  
  const result: Record<string, number> = {};
  
  // Calculate pro-rated exposure for each month
  Object.entries(businessDaysByMonth).forEach(([month, days]) => {
    const ratio = days / totalBusinessDays;
    result[month] = parseFloat((ratio * totalExposure).toFixed(2));
    console.log(`Month ${month}: ${days} days, ratio ${ratio}, allocated ${result[month]}`);
  });
  
  return result;
}

/**
 * Formats a date into a month key string (MMM-YY format)
 * 
 * @param date The date to format
 * @returns The formatted month key (e.g., "Mar-24")
 */
export function formatMonthKey(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    year: '2-digit'
  });
}

