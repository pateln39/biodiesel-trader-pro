
import { ExposureCategory } from '@/types/exposure';
import { 
  shouldUseSpecialBackground, 
  formatExposureTableProduct 
} from '@/utils/productMapping';

/**
 * Get the color class for a category in the exposure table
 */
export const getCategoryColorClass = (category: string): string => {
  switch (category) {
    case 'Physical':
      return 'bg-orange-800';
    case 'Pricing':
      return 'bg-green-800';
    case 'Paper':
      return 'bg-blue-800';
    case 'Exposure':
      return 'bg-green-600';
    default:
      return '';
  }
};

/**
 * Determine if a product should be shown for a specific category
 */
export const shouldShowProductInCategory = (product: string, category: string): boolean => {
  if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
    return false;
  }
  
  if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
    return false;
  }
  
  return true;
};

/**
 * Get the appropriate background color class for a product in the exposure table
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
    return 'bg-purple-300'; // Pricing instrument total
  }
  
  // Light purple background for specific pricing instruments
  if (shouldUseSpecialBackground(product)) {
    return 'bg-purple-300'; // Light purple
  }
  
  // Default background for biodiesel products
  return 'bg-green-600';
};

/**
 * Order categories according to predefined order
 */
export const orderVisibleCategories = (
  visibleCategories: string[], 
  categoryOrder: readonly string[]
): string[] => {
  return [...categoryOrder].filter(category => visibleCategories.includes(category));
};
