
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
  // For now, show all products in all categories
  // This could be refined further based on product type
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
