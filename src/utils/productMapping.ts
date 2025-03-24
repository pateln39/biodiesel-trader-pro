
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
      return 'Platts LSGO';
    case 'HVO':
      return 'Argus HVO';
    case 'GASOIL':
      return 'ICE GASOIL FUTURES';
    default:
      return product;
  }
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
  
  if (relationshipType === 'FP') {
    return `${product} FP`;
  }
  
  if (relationshipType === 'DIFF' && oppositeProduct) {
    return `${product}/${oppositeProduct} DIFF`;
  }
  
  if (relationshipType === 'SPREAD' && oppositeProduct) {
    return `${product}/${oppositeProduct} SPREAD`;
  }
  
  return product;
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
      oppositeProduct: oppositeProduct,
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
    oppositeProduct: null,
    relationshipType: 'FP'
  };
};
