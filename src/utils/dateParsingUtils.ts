import { parse, isValid, format } from 'date-fns';

/**
 * Result of attempting to parse a date value
 */
export interface DateParsingResult {
  success: boolean;
  date: Date | null;
  error?: string;
}

/**
 * Parses a value from Excel into a JavaScript Date object
 * Handles multiple formats:
 * - Already a Date object
 * - Excel serial numbers
 * - ISO date strings (YYYY-MM-DD)
 * - UK format (DD/MM/YYYY)
 * - US format (MM/DD/YYYY)
 * - Text dates ("March 20, 2024")
 * 
 * @param value The value to parse
 * @returns Object containing success status and parsed date or error message
 */
export function parseExcelDate(value: any): DateParsingResult {
  // Case: empty or null value
  if (value === null || value === undefined || value === '') {
    return {
      success: false,
      date: null,
      error: 'Empty date value'
    };
  }

  // Case: Already a Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return {
        success: false,
        date: null,
        error: 'Invalid Date object'
      };
    }
    return { success: true, date: value };
  }

  // Case: Excel serial number (Excel stores dates as days since 1900-01-01)
  if (typeof value === 'number' && !isNaN(value)) {
    // Excel to JS date conversion
    // Excel serial date 1 = 1900-01-01, but JS thinks it's 1899-12-31
    // There's also the leap year bug where Excel thinks 1900 was a leap year
    try {
      // For dates after Feb 28, 1900, we need to adjust for Excel's leap year bug
      const excelDate = value > 60 ? value - 1 : value;
      const msFromExcelEpoch = (excelDate - 25569) * 86400 * 1000;
      const date = new Date(msFromExcelEpoch);
      
      // Check if the resulting date is reasonable (between 1900 and 2100)
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return { success: true, date };
      }
    } catch (e) {
      // Fall through to other parsing methods
    }
  }

  // Case: String formats
  if (typeof value === 'string') {
    // Try ISO format first (YYYY-MM-DD)
    try {
      const isoDate = new Date(value);
      if (!isNaN(isoDate.getTime())) {
        return { success: true, date: isoDate };
      }
    } catch (e) {
      // Continue to other formats
    }

    // Try common date formats
    const formats = [
      'yyyy-MM-dd',      // ISO: 2024-03-20
      'dd/MM/yyyy',      // UK: 20/03/2024
      'MM/dd/yyyy',      // US: 03/20/2024
      'dd-MM-yyyy',      // 20-03-2024
      'MM-dd-yyyy',      // 03-20-2024
      'dd.MM.yyyy',      // 20.03.2024
      'MM.dd.yyyy',      // 03.20.2024
      'MMMM d, yyyy',    // March 20, 2024
      'd MMMM yyyy',     // 20 March 2024
      'MMM d, yyyy',     // Mar 20, 2024
      'd MMM yyyy'       // 20 Mar 2024
    ];

    for (const dateFormat of formats) {
      try {
        const parsedDate = parse(value, dateFormat, new Date());
        if (isValid(parsedDate)) {
          return { success: true, date: parsedDate };
        }
      } catch (e) {
        // Try next format
      }
    }

    // Try to extract date components and build date
    // This handles many non-standard formats
    const dateRegex = /(\d{1,4})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,4})/;
    const match = value.match(dateRegex);
    
    if (match) {
      const [_, part1, part2, part3] = match;
      
      // Try to determine if it's MM/DD/YYYY or DD/MM/YYYY or YYYY/MM/DD
      let year, month, day;
      
      // If part1 is a 4-digit number, assume YYYY/MM/DD
      if (part1.length === 4 && parseInt(part1) >= 1900) {
        year = parseInt(part1);
        month = parseInt(part2);
        day = parseInt(part3);
      } 
      // If part3 is a 4-digit number, assume either MM/DD/YYYY or DD/MM/YYYY
      else if (part3.length === 4 && parseInt(part3) >= 1900) {
        year = parseInt(part3);
        
        // Guess MM/DD vs DD/MM based on values
        // If part1 > 12, it must be a day
        if (parseInt(part1) > 12) {
          day = parseInt(part1);
          month = parseInt(part2);
        } 
        // If part2 > 12, part1 must be a month
        else if (parseInt(part2) > 12) {
          month = parseInt(part1);
          day = parseInt(part2);
        }
        // Both could be either - default to MM/DD as it's common in Excel
        else {
          month = parseInt(part1);
          day = parseInt(part2);
        }
      }
      
      // Validate and create date
      if (year && month && day) {
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day); // month is 0-indexed in JS
          if (!isNaN(date.getTime())) {
            return { success: true, date };
          }
        }
      }
    }
  }

  // If we get here, we couldn't parse the date
  return {
    success: false,
    date: null,
    error: 'Invalid date format. Supported formats include: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, Month D, YYYY'
  };
}

/**
 * Format a date as YYYY-MM-DD for database storage,
 * preserving the date exactly as it appears in the UI without timezone adjustments
 */
export function formatDateForStorage(date: Date): string {
  // Extract the year, month, and day using local date methods to prevent timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
