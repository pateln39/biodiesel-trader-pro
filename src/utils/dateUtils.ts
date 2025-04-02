
import { format, isWithinInterval, eachMonthOfInterval, addMonths, startOfMonth, endOfMonth } from 'date-fns';

export const isDateRangeInFuture = (startDate: Date, endDate: Date): boolean => {
  const now = new Date();
  return startDate > now && endDate > now;
};

export const formatDateForFutureMonth = (date: Date): string => {
  return format(date, 'MMM-yy');
};

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatDateForStorage = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getMonthsInDateRange = (startDate: Date, endDate: Date): string[] => {
  // Ensure start date is before end date
  const validStartDate = startDate < endDate ? startDate : endDate;
  const validEndDate = endDate > startDate ? endDate : startDate;
  
  // Get all months in the interval
  const months = eachMonthOfInterval({
    start: startOfMonth(validStartDate),
    end: endOfMonth(validEndDate)
  });
  
  // Format each month as MMM-yy
  return months.map(date => format(date, 'MMM-yy'));
};

export const getNextMonths = (count: number = 12): string[] => {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const month = addMonths(now, i);
    months.push(format(month, 'MMM-yy'));
  }
  
  return months;
};

export const formatMonthCode = (monthCode: string): string => {
  // Convert month codes like "APR25" to "Apr-25"
  if (monthCode.length === 5) {
    const month = monthCode.substring(0, 3);
    const year = monthCode.substring(3);
    return `${month.charAt(0).toUpperCase()}${month.slice(1).toLowerCase()}-${year}`;
  }
  return monthCode;
};

// Functions for business day calculations
export const getBusinessDaysByMonth = (startDate: Date, endDate: Date): Record<string, number> => {
  // This is a placeholder implementation
  // In a real application, you would calculate actual business days excluding weekends and holidays
  const result: Record<string, number> = {};
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  
  months.forEach(month => {
    const monthKey = format(month, 'MMM-yy');
    // Simplified: assigning 20 business days per month
    result[monthKey] = 20;
  });
  
  return result;
};

export const distributeValueByBusinessDays = (
  value: number, 
  businessDaysByMonth: Record<string, number>
): Record<string, number> => {
  const totalDays = Object.values(businessDaysByMonth).reduce((sum, days) => sum + days, 0);
  if (totalDays === 0) return {};
  
  const result: Record<string, number> = {};
  
  Object.entries(businessDaysByMonth).forEach(([month, days]) => {
    result[month] = (value * days) / totalDays;
  });
  
  return result;
};
