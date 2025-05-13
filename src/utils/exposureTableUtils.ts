
import { ExposureCategory } from '@/types/exposure';

/**
 * Order visible categories based on the canonical order
 */
export const orderVisibleCategories = (
  visibleCategories: string[],
  categoryOrder: readonly string[]
): string[] => {
  return categoryOrder.filter(category => visibleCategories.includes(category));
};

/**
 * Determine if a product should be shown in a given category column
 */
export const shouldShowProductInCategory = (product: string, category: string): boolean => {
  // Products to exclude from Physical section
  if (category === 'Physical' && (
    product === 'EFP' || 
    product === 'ICE GASOIL FUTURES' || 
    product === 'Platts Diesel'
  )) {
    return false;
  }
  
  // Products to exclude from Paper section
  if (category === 'Paper' && product === 'EFP') {
    return false;
  }
  
  // Default case - show all other products in all other categories
  return true;
};

/**
 * Get the appropriate CSS class for a category header
 */
export const getCategoryColorClass = (category: string): string => {
  switch (category) {
    case 'Physical':
      return 'bg-orange-600';
    case 'Pricing':
      return 'bg-green-800';
    case 'Paper':
      return 'bg-blue-800';
    case 'Exposure':
      return 'bg-green-600';
    default:
      return 'bg-gray-600';
  }
};

/**
 * Determines if a product is a biodiesel product
 */
export const isBiodieselProduct = (product: string): boolean => {
  return product.includes('Argus');
};

/**
 * Determines if a product is a pricing instrument
 */
export const isPricingInstrumentProduct = (product: string): boolean => {
  return !isBiodieselProduct(product);
};

/**
 * Get the background class for a product in the exposure table
 */
export const getExposureProductBackgroundClass = (
  product: string, 
  isTotal: boolean = false,
  isPricingInstrumentTotal: boolean = false
): string => {
  if (isTotal) {
    return 'bg-gray-500'; // Total Row background
  }
  
  if (isPricingInstrumentTotal) {
    return 'bg-purple-700'; // Changed: Pricing instrument total background to medium-dark purple
  }
  
  // Special backgrounds for specific products
  if (product === 'ICE GASOIL FUTURES' || product === 'EFP' || 
      product === 'Platts LSGO' || product === 'Platts Diesel') {
    return 'bg-purple-700'; // Changed: Specific product backgrounds to medium-dark purple
  }
  
  // Default background for biodiesel products
  return 'bg-green-600';
};

/**
 * Calculate business days for a specific month
 * @param monthCode Month code in format "MMM-YY" (e.g., "May-24")
 * @returns Number of business days in the month
 */
export const calculateBusinessDaysForMonth = (monthCode: string): number => {
  // Parse the month code to get year and month
  const [monthStr, yearStr] = monthCode.split('-');
  
  // Map month name to month number (0-based)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = monthNames.findIndex(m => m === monthStr);
  
  if (monthIndex === -1) return 0;
  
  // Create year number (assuming 20xx for two-digit years)
  const year = 2000 + parseInt(yearStr);
  
  // Create date objects for first and last day of month
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  
  // Use the existing utility function to count business days
  return countBusinessDays(firstDayOfMonth, lastDayOfMonth);
};

// Import the countBusinessDays function from dateUtils to avoid duplicating code
import { countBusinessDays } from '@/utils/dateUtils';

