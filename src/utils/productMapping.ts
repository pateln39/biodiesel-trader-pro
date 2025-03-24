
/**
 * Maps paper product names to standardized pricing instrument names
 * Ensures exposures are consolidated under the correct product columns
 */

// Key pricing instrument names (canonical product names)
export const CANONICAL_PRODUCTS = {
  UCOME: 'Argus UCOME',
  RME: 'Argus RME',
  FAME0: 'Argus FAME0',
  LSGO: 'Platts LSGO',
  DIESEL: 'Platts Diesel'
};

// Maps paper product names and codes to their canonical pricing instrument name
export const mapProductToCanonical = (product: string): string => {
  // Handle FP (Fixed Price) products
  if (product === 'UCOME' || product === 'UCOME FP' || product.includes('UCOME-')) {
    return CANONICAL_PRODUCTS.UCOME;
  }
  
  if (product === 'RME' || product === 'RME FP' || product.includes('RME-')) {
    return CANONICAL_PRODUCTS.RME;
  }
  
  if (product === 'FAME0' || product === 'FAME0 FP' || product.includes('FAME0-')) {
    return CANONICAL_PRODUCTS.FAME0;
  }
  
  if (product === 'LSGO' || product.includes('LSGO')) {
    return CANONICAL_PRODUCTS.LSGO;
  }
  
  if (product === 'diesel' || product.includes('diesel') || product.includes('Diesel')) {
    return CANONICAL_PRODUCTS.DIESEL;
  }
  
  // If no mapping found, return the original product name
  return product;
};

// Parse a paper trade instrument name to determine the products involved
export const parsePaperInstrument = (
  instrument: string
): { baseProduct: string; oppositeProduct?: string; relationshipType: 'FP' | 'DIFF' | 'SPREAD' } => {
  if (!instrument) {
    return { baseProduct: '', relationshipType: 'FP' };
  }
  
  // Check for DIFF relationship
  if (instrument.includes('DIFF')) {
    // For DIFFs, the format is usually "{product} DIFF"
    const baseProduct = instrument.replace(' DIFF', '');
    // DIFFs are typically against LSGO
    return {
      baseProduct: mapProductToCanonical(baseProduct),
      oppositeProduct: CANONICAL_PRODUCTS.LSGO,
      relationshipType: 'DIFF'
    };
  }
  
  // Check for SPREAD relationship
  if (instrument.includes('SPREAD') || instrument.includes('-')) {
    // For SPREADs, the format is usually "{product1}-{product2} SPREAD" or just "{product1}-{product2}"
    const products = instrument
      .replace(' SPREAD', '')
      .split('-')
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
    relationshipType: 'FP'
  };
};
