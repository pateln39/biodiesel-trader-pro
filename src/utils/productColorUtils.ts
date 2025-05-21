
import { COLOR_OPTIONS, ColorOption } from '@/components/trades/ColorSelect';

// This file is kept for backward compatibility during the transition
// We're now storing color data in the database instead of localStorage

// Legacy function - will be deprecated
export const getCustomProductColors = (): Record<string, string> => {
  try {
    const storedColors = localStorage.getItem('custom_product_colors');
    return storedColors ? JSON.parse(storedColors) : {};
  } catch (error) {
    console.error('Error retrieving custom product colors:', error);
    return {};
  }
};

// Legacy function - will be deprecated
export const saveCustomProductColor = (productName: string, colorName: string): void => {
  // This function is now just a stub for backward compatibility
  console.warn('saveCustomProductColor is deprecated, product colors are now stored in the database');
};

// Get a full color class for a product based on color name
export const getColorClassFromName = (colorName: string): string => {
  const colorOption = COLOR_OPTIONS.find(c => c.name === colorName);
  return colorOption ? `${colorOption.class} ${colorOption.textClass}` : '';
};

// Get a suitable color name that isn't already used - uses existing products
export const getSuggestedColor = (existingProducts: string[]): string => {
  // This function now just returns a random color since we're managing colors in the database
  const randomIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
  return COLOR_OPTIONS[randomIndex].name;
};
