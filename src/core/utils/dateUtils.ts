
import { format, addMonths, startOfMonth } from 'date-fns';

/**
 * Get an array of period strings for the next N months
 */
export const getNextMonths = (count: number): string[] => {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = addMonths(startOfMonth(today), i);
    months.push(format(date, 'MMM yyyy'));
  }
  
  return months;
};

/**
 * Parse an Excel date serial number to a JavaScript Date
 */
export const parseExcelDateSerial = (serialNumber: number): Date => {
  // Excel serial dates start from January 0, 1900
  // 1 = January 1, 1900
  // Need to adjust for the fact that Excel incorrectly thinks 1900 was a leap year
  const adjustedSerial = serialNumber > 59 ? serialNumber - 1 : serialNumber;
  
  // Convert to milliseconds and adjust for Excel's start date
  const msFromExcelStart = (adjustedSerial - 1) * 24 * 60 * 60 * 1000;
  const excelStartDate = new Date(1900, 0, 1);
  const excelStartTime = excelStartDate.getTime();
  
  return new Date(excelStartTime + msFromExcelStart);
};

/**
 * Format a date object to string in YYYY-MM-DD format
 */
export const formatDateString = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
