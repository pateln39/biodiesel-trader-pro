
import { parse, isValid, format } from 'date-fns';

/**
 * Format a date string for display and storage
 */
export function formatDateString(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses an Excel date serial number to a JavaScript Date
 * Excel stores dates as days since 1900-01-01
 */
export function parseExcelDateSerial(serialNumber: number): Date {
  // For dates after Feb 28, 1900, we need to adjust for Excel's leap year bug
  const excelDate = serialNumber > 60 ? serialNumber - 1 : serialNumber;
  const msFromExcelEpoch = (excelDate - 25569) * 86400 * 1000;
  return new Date(msFromExcelEpoch);
}

/**
 * Parse an ISO date string
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format a date as an ISO string without time component
 */
export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse a date string in various formats
 */
export function parseDateString(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try ISO format
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try common formats
  const formats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'];
  for (const dateFormat of formats) {
    const parsedDate = parse(dateString, dateFormat, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }
  
  return null;
}
