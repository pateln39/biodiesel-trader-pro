
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
