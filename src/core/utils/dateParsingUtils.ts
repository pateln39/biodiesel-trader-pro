
/**
 * Format a date string for display
 * Converts ISO date strings to DD/MM/YYYY format
 */
export function formatDateString(dateStr: string | Date | null): string {
  if (!dateStr) return '';
  
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Parse a date from Excel date serial number
 * Excel date serial numbers are days since December 31, 1899
 */
export function parseExcelDateSerial(serialNumber: number): Date {
  // Excel uses a different epoch (December 31, 1899)
  // Also accounts for the Excel leap year bug in 1900
  const excelEpoch = new Date(1899, 11, 30);
  
  // Convert to milliseconds and add to the Excel epoch
  const milliseconds = serialNumber * 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + milliseconds);
}

/**
 * Parse a date from Excel date (alias for better naming)
 */
export function parseExcelDate(serialNumber: number): Date {
  return parseExcelDateSerial(serialNumber);
}

/**
 * Parse a date from ISO date string
 */
export function parseISODate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

/**
 * Format a date as an ISO string (YYYY-MM-DD)
 */
export function formatISODate(date: Date | null): string {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string in various formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try different date formats
  
  // Format: DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(part => parseInt(part, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Format: YYYY-MM-DD
  if (dateStr.includes('-')) {
    const date = new Date(dateStr);
    
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try native parsing as a fallback
  const date = new Date(dateStr);
  
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}
