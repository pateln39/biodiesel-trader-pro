import { calculateExposures } from './exposureCalculation';

/**
 * Calculate daily pricing distribution for a given period
 * Distributes the exposure evenly across business days in the period
 */
export const calculateDailyPricingDistribution = (
  tokens: any[],
  quantity: number,
  buySell: string,
  startDate: Date,
  endDate: Date
): Record<string, Record<string, number>> => {
  const distribution: Record<string, Record<string, number>> = {};
  
  // Get business days between start and end date
  const businessDays = getBusinessDaysBetweenDates(startDate, endDate);
  if (businessDays.length === 0) return distribution;
  
  // Calculate exposures from tokens
  const exposures = calculateExposures(tokens, quantity, buySell);
  
  // For each instrument in pricing exposures, distribute across business days
  Object.entries(exposures.pricing || {}).forEach(([instrument, totalExposure]) => {
    if (!distribution[instrument]) {
      distribution[instrument] = {};
    }
    
    // Daily exposure amount (evenly distributed)
    const dailyExposure = Number(totalExposure) / businessDays.length;
    
    // Assign to each business day
    businessDays.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      distribution[instrument][dateStr] = dailyExposure;
    });
  });
  
  return distribution;
};

/**
 * Calculate paper daily distribution for a given period month
 * Distributes the exposure evenly across business days in the month
 */
export const calculatePaperDailyDistribution = (
  exposures: Record<string, number>,
  period: string
): Record<string, Record<string, number>> => {
  const distribution: Record<string, Record<string, number>> = {};
  
  // Parse period (e.g., "May-24") to get start and end date of the month
  const [monthName, yearStr] = period.split('-');
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    .findIndex(m => m === monthName);
  
  if (monthIndex === -1 || !yearStr) {
    console.error('Invalid period format:', period);
    return distribution;
  }
  
  const year = 2000 + parseInt(yearStr);
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0); // Last day of month
  
  // Get business days in the month
  const businessDays = getBusinessDaysBetweenDates(startDate, endDate);
  if (businessDays.length === 0) return distribution;
  
  // For each instrument, distribute exposure across business days
  Object.entries(exposures).forEach(([instrument, totalExposure]) => {
    if (!distribution[instrument]) {
      distribution[instrument] = {};
    }
    
    // Daily exposure amount (evenly distributed)
    const dailyExposure = Number(totalExposure) / businessDays.length;
    
    // Assign to each business day
    businessDays.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      distribution[instrument][dateStr] = dailyExposure;
    });
  });
  
  return distribution;
};

/**
 * Get all business days (Mon-Fri) between two dates
 */
export const getBusinessDaysBetweenDates = (startDate: Date, endDate: Date): Date[] => {
  const businessDays: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Adjust to start of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Adjust end date to end of day
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);
  
  // Loop through days
  while (currentDate <= adjustedEndDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Add only business days (Mon-Fri: 1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      businessDays.push(new Date(currentDate));
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
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
