
// Importing the necessary types
import { MonthlyDistribution } from '@/types';

// Function to check if a date is a working day (Monday to Friday)
export const isWorkingDay = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
};

// Function to calculate the number of working days between two dates
export const getWorkingDaysBetweenDates = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

// Function to calculate the number of calendar days between two dates
export const getDaysBetweenDates = (startDate: Date, endDate: Date): number => {
  // Calculate the time difference in milliseconds
  const timeDifference = endDate.getTime() - startDate.getTime();
  
  // Convert milliseconds to days (including both start and end dates)
  return Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1;
};

// Function to format a date as a month code (e.g., 'Mar-24')
export const formatDateAsMonthCode = (date: Date): string => {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(2);
  return `${month}-${year}`;
};

// Function to format a date as a day code (e.g., '2024-03-15')
export const formatDateAsDayCode = (date: Date): string => {
  return date.toISOString().split('T')[0]; // Returns in format YYYY-MM-DD
};

// Function to distribute a quantity evenly across working days within a date range
export const distributeQuantityByWorkingDays = (
  startDate: Date, 
  endDate: Date, 
  quantity: number
): MonthlyDistribution => {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('Invalid date parameters:', { startDate, endDate });
    return {};
  }
  
  const totalWorkingDays = getWorkingDaysBetweenDates(startDate, endDate);
  
  if (totalWorkingDays === 0) {
    console.warn('No working days in the given date range:', { startDate, endDate });
    return {};
  }
  
  const quantityPerDay = quantity / totalWorkingDays;
  
  // Track distribution per month
  const monthlyDistribution: MonthlyDistribution = {};
  
  // Iterate through each date in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
      const monthCode = formatDateAsMonthCode(currentDate);
      
      if (!monthlyDistribution[monthCode]) {
        monthlyDistribution[monthCode] = 0;
      }
      
      monthlyDistribution[monthCode] += quantityPerDay;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Round the values to 2 decimal places for better display
  Object.keys(monthlyDistribution).forEach(month => {
    monthlyDistribution[month] = parseFloat(monthlyDistribution[month].toFixed(2));
  });
  
  return monthlyDistribution;
};

// Function to distribute a quantity evenly across all days (including weekends) within a date range
export const distributeQuantityByDays = (
  startDate: Date, 
  endDate: Date, 
  quantity: number
): Record<string, number> => {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('Invalid date parameters:', { startDate, endDate });
    return {};
  }
  
  const totalDays = getDaysBetweenDates(startDate, endDate);
  
  if (totalDays === 0) {
    console.warn('Invalid date range (no days):', { startDate, endDate });
    return {};
  }
  
  const quantityPerDay = quantity / totalDays;
  
  // Track distribution per day
  const dailyDistribution: Record<string, number> = {};
  
  // Iterate through each date in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayCode = formatDateAsDayCode(currentDate);
    dailyDistribution[dayCode] = parseFloat(quantityPerDay.toFixed(2));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyDistribution;
};

// Function to get all months between two dates
export const getMonthsBetweenDates = (startDate: Date, endDate: Date): string[] => {
  const months: string[] = [];
  const currentDate = new Date(startDate);
  
  // Set to first day of month to ensure we catch the full month
  currentDate.setDate(1);
  
  // Create end date on the first of the month after the end date
  const finalDate = new Date(endDate);
  finalDate.setDate(1);
  finalDate.setMonth(finalDate.getMonth() + 1);
  
  while (currentDate < finalDate) {
    months.push(formatDateAsMonthCode(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
};
