
/**
 * Utility functions for formatting values in the UI
 */

/**
 * Format a date for display
 * @param date Date to format
 * @param options Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | undefined, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Use 'en-GB' locale to get "1 Jan 2025" format without leading zero on day
    return new Intl.DateTimeFormat('en-GB', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format a number for display
 * @param value Number to format
 * @param options Optional Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | string | undefined, 
  options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2
  }
): string => {
  if (value === undefined || value === null) return '-';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '-';
  
  try {
    return new Intl.NumberFormat('en-US', options).format(numValue);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '-';
  }
};

/**
 * Format a currency value for display
 * @param value Currency value to format
 * @param currency Currency code (default: 'USD')
 * @param options Optional Intl.NumberFormatOptions
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | string | undefined,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
): string => {
  if (value === undefined || value === null) return '-';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '-';
  
  try {
    return new Intl.NumberFormat('en-US', options).format(numValue);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '-';
  }
};

/**
 * Format a percentage for display
 * @param value Percentage value to format
 * @param options Optional Intl.NumberFormatOptions
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number | string | undefined,
  options: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
): string => {
  if (value === undefined || value === null) return '-';
  
  // Convert the value to a decimal if it's not already
  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else {
    numValue = value;
  }
  
  // Ensure value is in decimal form for percentage (1 = 100%)
  if (numValue > 1 && options.style === 'percent') {
    numValue = numValue / 100;
  }
  
  if (isNaN(numValue)) return '-';
  
  try {
    return new Intl.NumberFormat('en-US', options).format(numValue);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '-';
  }
};
