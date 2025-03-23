
/**
 * Generate a unique reference for a trade leg
 */
export const generateLegReference = (parentTradeReference: string, legIndex: number): string => {
  return `${parentTradeReference}-L${legIndex + 1}`;
};

/**
 * Generate a unique trade reference
 */
export const generateTradeReference = (tradeType: 'physical' | 'paper'): string => {
  const prefix = tradeType === 'physical' ? 'PHY' : 'PAP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format quantity for display
 */
export const formatQuantity = (quantity: number): string => {
  return quantity.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Generate instrument name based on product and pricing method
 */
export const generateInstrumentName = (product: string, pricingMethod: string): string => {
  return `${product} ${pricingMethod}`;
};

/**
 * Format product display for UI
 */
export const formatProductDisplay = (
  product: string,
  relationshipType?: string,
  rightSideProduct?: string
): string => {
  if (!product) return "";
  
  if (relationshipType === 'DIFF' || relationshipType === 'SPREAD') {
    if (rightSideProduct) {
      return relationshipType === 'DIFF' 
        ? `${product} DIFF` 
        : `${product}-${rightSideProduct} SPREAD`;
    }
  }
  
  return product;
};

/**
 * Format MTM display for UI
 */
export const formatMTMDisplay = (
  product: string,
  relationshipType?: string,
  rightSideProduct?: string
): string => {
  if (!product) return "";
  
  if (relationshipType === 'DIFF' || relationshipType === 'SPREAD') {
    if (rightSideProduct) {
      return relationshipType === 'DIFF' 
        ? `${product} - ${rightSideProduct}` 
        : `${product} - ${rightSideProduct}`;
    }
  }
  
  return product;
};
