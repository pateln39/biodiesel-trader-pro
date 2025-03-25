/**
 * Maps product codes to their canonical display names for exposure reporting
 */
export const mapProductToCanonical = (product: string): string => {
  switch (product) {
    case 'UCOME':
    case 'UCOME-5':
      return 'Argus UCOME';
    case 'FAME0':
      return 'Argus FAME0';
    case 'RME':
    case 'RME DC':
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
      return 'Platts Diesel';
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
  if (simplified === 'Diesel') {
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
