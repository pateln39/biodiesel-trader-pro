
/**
 * Maps product codes to their canonical display names for exposure reporting
 */
export const mapProductToCanonical = (product: string): string => {
  switch (product) {
    case 'UCOME':
      return 'Argus UCOME';
    case 'FAME0':
      return 'Argus FAME0';
    case 'RME':
      return 'Argus RME';
    case 'LSGO':
    case 'Platts LSGO':
      return 'Platts LSGO';
    case 'HVO':
    case 'HVO_FP':
      return 'Argus HVO';
    case 'GASOIL':
    case 'GASOIL_FP':
      return 'ICE GASOIL FUTURES';
    case 'diesel':
    case 'Platts diesel':
    case 'Platts Diesel': // Add this case to ensure consistency
      return 'Platts Diesel'; // Changed to capital D for consistency
    default:
      return product;
  }
};

/**
 * Strips prefix from product name for display purposes
 */
export const stripProductPrefix = (product: string): string => {
  if (!product) return '';
  
  // Remove common prefixes
  return product
    .replace('Argus ', '')
    .replace('Platts ', '')
    .replace('ICE ', '');
};

/**
 * Formats product names for exposure table display
 * Converts full canonical names to simplified display names
 */
export const formatExposureTableProduct = (product: string): string => {
  if (!product) return '';
  
  // Special case for GASOIL
  if (product === 'ICE GASOIL FUTURES') {
    return 'ICE GASOIL';
  }
  
  // For other products, strip prefixes and keep base name
  const simplified = stripProductPrefix(product);
  
  // Special case for Diesel (capitalize D)
  if (simplified.toLowerCase() === 'diesel') {
    return 'Diesel';
  }
  
  return simplified;
};

/**
 * Returns display name for a product based on type
 */
export const formatProductDisplay = (
  product: string, 
  relationshipType: string,
  oppositeProduct?: string | null
): string => {
  if (!product) return '';
  
  const cleanProduct = stripProductPrefix(product);
  
  if (relationshipType === 'FP') {
    return `${cleanProduct} FP`;
  }
  
  if (relationshipType === 'DIFF' && oppositeProduct) {
    return `${cleanProduct} DIFF`;
  }
  
  if (relationshipType === 'SPREAD' && oppositeProduct) {
    const cleanOppositeProduct = stripProductPrefix(oppositeProduct);
    return `${cleanProduct}/${cleanOppositeProduct}`;
  }
  
  return cleanProduct;
};

/**
 * Parse a paper trade instrument name to determine the products involved
 */
export const parsePaperInstrument = (
  instrument: string
): { baseProduct: string; oppositeProduct: string | null; relationshipType: 'FP' | 'DIFF' | 'SPREAD' } => {
  if (!instrument) {
    return { baseProduct: '', oppositeProduct: null, relationshipType: 'FP' };
  }
  
  // Check for DIFF relationship
  if (instrument.includes('DIFF')) {
    // For DIFFs, the format is usually "{product} DIFF"
    const baseProduct = instrument.replace(' DIFF', '');
    // DIFFs are typically against LSGO
    const oppositeProduct = 'LSGO';
    
    return {
      baseProduct: mapProductToCanonical(baseProduct),
      oppositeProduct: mapProductToCanonical(oppositeProduct),
      relationshipType: 'DIFF'
    };
  }
  
  // Check for SPREAD relationship
  if (instrument.includes('SPREAD') || instrument.includes('-')) {
    // For SPREADs, the format is usually "{product1}-{product2} SPREAD" or just "{product1}-{product2}"
    const products = instrument
      .replace(' SPREAD', '')
      .split(/[-\/]/)  // Split on either hyphen or forward slash
      .map(p => p.trim());
    
    if (products.length >= 2) {
      return {
        baseProduct: mapProductToCanonical(products[0]),
        oppositeProduct: mapProductToCanonical(products[1]),
        relationshipType: 'SPREAD'
      };
    }
  }
  
  // Default to FP, extract the product name
  let baseProduct = instrument.replace(' FP', '');
  
  return {
    baseProduct: mapProductToCanonical(baseProduct),
    oppositeProduct: null,
    relationshipType: 'FP'
  };
};

/**
 * Calculate the display price for a paper trade based on relationship type
 * For FP trades: returns the original price
 * For DIFF/SPREAD trades: returns the absolute difference between left and right side prices
 */
export const calculateDisplayPrice = (
  relationshipType: 'FP' | 'DIFF' | 'SPREAD',
  leftPrice: number,
  rightSidePrice?: number | null
): number => {
  if (relationshipType === 'FP' || !rightSidePrice) {
    return leftPrice;
  }
  
  // For DIFF and SPREAD, return absolute difference
  return Math.abs(leftPrice - rightSidePrice);
};

/**
 * Returns true if the product is a pricing instrument that should be included
 * in the exposure table
 */
export const isPricingInstrument = (product: string): boolean => {
  // These are the only products that should appear in the exposure table
  const pricingInstruments = [
    'ICE GASOIL FUTURES',
    'Platts LSGO',
    'Platts Diesel',
    'Argus UCOME',
    'Argus FAME0',
    'Argus RME',
    'Argus HVO'
  ];
  
  return pricingInstruments.includes(product);
};

/**
 * Check if the product should have a special background color in the exposure table
 */
export const shouldUseSpecialBackground = (product: string): boolean => {
  const specialBackgroundProducts = [
    'ICE GASOIL FUTURES',
    'Platts LSGO',
    'Platts Diesel',
  ];
  
  return specialBackgroundProducts.includes(product);
};

/**
 * Returns the appropriate background color class for a product in the exposure table
 * Used for styling the header cells in the exposure column
 */
export const getExposureProductBackgroundClass = (
  product: string, 
  isTotal: boolean = false,
  isPricingInstrumentTotal: boolean = false
): string => {
  if (isTotal) {
    return 'bg-gray-500'; // Total Row background - keep gray
  }
  
  if (isPricingInstrumentTotal) {
    return 'bg-purple-300'; // Changed to light purple for pricing instrument total
  }
  
  // Light purple background for specific pricing instruments
  if (shouldUseSpecialBackground(product)) {
    return 'bg-purple-300'; // Changed to light purple (#D6BCFA equivalent in Tailwind)
  }
  
  // Default background for biodiesel products
  return 'bg-green-600';
};
