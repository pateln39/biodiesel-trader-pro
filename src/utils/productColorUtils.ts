
import { COLOR_OPTIONS, ColorOption } from '@/components/trades/ColorSelect';

const PRODUCT_COLORS_STORAGE_KEY = 'custom_product_colors';

// Get custom product colors from localStorage
export const getCustomProductColors = (): Record<string, string> => {
  try {
    const storedColors = localStorage.getItem(PRODUCT_COLORS_STORAGE_KEY);
    return storedColors ? JSON.parse(storedColors) : {};
  } catch (error) {
    console.error('Error retrieving custom product colors:', error);
    return {};
  }
};

// Save custom product colors to localStorage
export const saveCustomProductColor = (productName: string, colorName: string): void => {
  try {
    const colorOption = COLOR_OPTIONS.find(c => c.name === colorName);
    if (!colorOption) return;

    const colorClass = `${colorOption.class} ${colorOption.textClass}`;
    
    const currentColors = getCustomProductColors();
    const updatedColors = { ...currentColors, [productName]: colorClass };
    
    localStorage.setItem(PRODUCT_COLORS_STORAGE_KEY, JSON.stringify(updatedColors));
  } catch (error) {
    console.error('Error saving custom product color:', error);
  }
};

// Get a full color class for a product based on color name
export const getColorClassFromName = (colorName: string): string => {
  const colorOption = COLOR_OPTIONS.find(c => c.name === colorName);
  return colorOption ? `${colorOption.class} ${colorOption.textClass}` : '';
};

// Get a suitable color name that isn't already used
export const getSuggestedColor = (existingProducts: string[]): string => {
  const existingColors = new Set(existingProducts.map(product => {
    const customColors = getCustomProductColors();
    if (customColors[product]) {
      // Extract color name from class string
      const colorClass = customColors[product].split(' ')[0].replace('bg-', '');
      return COLOR_OPTIONS.find(c => c.class.includes(colorClass))?.name || '';
    }
    return '';
  }).filter(Boolean));
  
  // Find first color not in use
  const availableColor = COLOR_OPTIONS.find(color => !existingColors.has(color.name));
  return availableColor?.name || COLOR_OPTIONS[0].name;
};
