
/**
 * Get an array of the next N months in format 'MMM-YY'
 * Example: ['Jan-23', 'Feb-23', ...]
 */
export function getNextMonths(count: number = 12): string[] {
  const result: string[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  for (let i = 0; i < count; i++) {
    // Format the two-digit year (YY)
    const twoDigitYear = (currentYear % 100).toString().padStart(2, '0');
    
    // Add to result array
    result.push(`${months[currentMonth]}-${twoDigitYear}`);
    
    // Move to next month
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  
  return result;
}

/**
 * Format a date into a standardized month code (e.g., 'Jan-23')
 */
export function formatMonthCode(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = (date.getFullYear() % 100).toString().padStart(2, '0');
  
  return `${month}-${year}`;
}

/**
 * Check if a period code represents a valid future period
 */
export function isValidFuturePeriod(periodCode: string): boolean {
  if (!periodCode || !periodCode.includes('-')) return false;
  
  const [monthStr, yearStr] = periodCode.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const monthIndex = months.findIndex(m => m === monthStr);
  if (monthIndex === -1) return false;
  
  const year = parseInt('20' + yearStr);
  if (isNaN(year)) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Check if the period is in the future
  return (year > currentYear) || (year === currentYear && monthIndex >= currentMonth);
}
