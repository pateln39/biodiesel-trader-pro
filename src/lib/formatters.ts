
/**
 * Utility functions for formatting data in the application
 */

/**
 * Format a date into a readable string
 * @param date - The date to format
 * @returns Formatted date string (e.g., "15 May 2023")
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  
  // Format as DD MMM YYYY
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/**
 * Format a number with thousands separators and optional decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a currency value with symbol
 * @param value - The number to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(value: number | null | undefined, currency: string = 'USD'): string {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Format a percentage value
 * @param value - The number to format (0.1 = 10%)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted percentage string (e.g., "10.00%")
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
