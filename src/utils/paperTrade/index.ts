
// Re-export all functions and types for backward compatibility
export * from './mtmTypes';
export * from './dateUtils';
export * from './priceUtils';
export * from './mtmCalculations';

// Import the formatDateForDatabase function from dateUtils
import { formatDateForDatabase } from './dateUtils';

// Utility function to get month start and end dates from a period string (e.g., 'Dec-23')
export const getMonthDates = (periodString: string): { startDate: Date; endDate: Date } | null => {
  try {
    // Split the period string into month and year
    const [month, year] = periodString.split('-');
    
    // Map month name to month index (0-11)
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      .findIndex(m => m === month);
    
    if (monthIndex === -1) {
      console.error(`Invalid month format in period string: ${periodString}`);
      return null;
    }
    
    // Year is in format 'XX', so prefix with '20' to get full year
    const fullYear = 2000 + parseInt(year);
    
    // Create start date (1st of the month)
    const startDate = new Date(fullYear, monthIndex, 1);
    
    // Create end date (last day of the month)
    const endDate = new Date(fullYear, monthIndex + 1, 0);
    
    return { startDate, endDate };
  } catch (error) {
    console.error(`Error parsing period string: ${periodString}`, error);
    return null;
  }
};

// Add a new helper function to calculate daily distribution
export const calculateDailyDistribution = (
  period: string,
  product: string,
  quantity: number,
  buySell: string
): Record<string, Record<string, number>> => {
  const monthDates = getMonthDates(period);
  if (!monthDates) {
    return {};
  }
  
  // Calculate business days
  const { startDate, endDate } = monthDates;
  const businessDays = getBusinessDaysCount(startDate, endDate);
  
  if (businessDays === 0) {
    return {};
  }
  
  // Calculate daily exposure
  const buySellMultiplier = buySell === 'buy' ? 1 : -1;
  const exposureValue = quantity * buySellMultiplier;
  const dailyExposure = exposureValue / businessDays;
  
  // Create distribution object
  const distribution: Record<string, Record<string, number>> = {};
  distribution[product] = {};
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Not weekend
      const dateStr = formatDateForDatabase(currentDate); // Use our timezone-safe formatter
      distribution[product][dateStr] = dailyExposure;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return distribution;
};

// Helper function to count business days
export const getBusinessDaysCount = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Check if day is not a weekend (0 = Sunday, 6 = Saturday)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};
