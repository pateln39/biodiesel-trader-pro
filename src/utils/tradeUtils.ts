// Generate a unique trade reference
export const generateTradeReference = (): string => {
  // Format: YYMMDD-XXXXX where XXXXX is a random 5-digit number
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  
  return `${year}${month}${day}-${random}`;
};

// Generate a leg reference from a trade reference
export const generateLegReference = (tradeReference: string, legNumber: number): string => {
  const suffix = String.fromCharCode(97 + legNumber); // 0 -> 'a', 1 -> 'b', etc.
  return `${tradeReference}-${suffix}`;
};

// Format a leg reference for display
export const formatLegReference = (tradeReference: string, legReference: string): string => {
  // If the leg reference already contains the trade reference, just return the leg reference
  if (legReference && legReference.startsWith(tradeReference)) {
    return legReference;
  }
  
  // Otherwise, if there's a suffix in the leg reference, append it to the trade reference
  if (legReference && legReference.includes('-')) {
    const suffix = legReference.split('-').pop();
    return `${tradeReference}-${suffix}`;
  }
  
  // Fallback: just return the trade reference
  return tradeReference;
};

// Generate a movement reference number that includes the leg reference
export const generateMovementReference = (tradeReference: string, legReference: string, movementCount: number): string => {
  // The trade reference from open_trades should already include the leg suffix
  // Just append the movement count
  return `${tradeReference}-${movementCount}`;
};

// Format a movement reference for display
export const formatMovementReference = (tradeReference: string, legReference: string, movementNumber: string | number): string => {
  // The trade reference should already include the leg suffix
  // Check if the movement number already includes the reference
  if (typeof movementNumber === 'string' && movementNumber.includes(tradeReference)) {
    return movementNumber;
  }
  
  // Format with movement number appended
  return `${tradeReference}-${movementNumber}`;
};

// Format product display name based on relationship type (for Trades table UI)
export const formatProductDisplay = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  if (!product) return '';
  
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return `${product}/LSGO`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return `${product} SPREAD`;
    default:
      return product;
  }
};

// Format MTM formula display (for MTM calculations and formula display)
export const formatMTMDisplay = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  if (!product) return '';
  
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      return `${product} DIFF`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}-${rightSideProduct}`;
      }
      return `${product}`;
    default:
      return product;
  }
};

// Calculate open quantity for a trade
export const calculateOpenQuantity = (
  quantity: number, 
  tolerance: number,
  scheduledQuantity: number
): number => {
  const maxQuantity = quantity * (1 + tolerance / 100);
  return Math.max(0, maxQuantity - scheduledQuantity);
};

// Format a date to a standard display format
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Updated to exclude Paper column when calculating netExposure
export const calculateNetExposure = (
  physical: number,
  pricing: number
): number => {
  return physical + pricing;
};

// Generate instrument name from product and relationship type (for database storage)
export const generateInstrumentName = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      return `${product} DIFF`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}-${rightSideProduct} SPREAD`;
      }
      return `${product} SPREAD`;
    default:
      return product;
  }
};

// Function to check if a product is a pricing instrument
export const isPricingInstrument = (product: string): boolean => {
  const pricingInstruments = ['ICE GASOIL FUTURES', 'Platts LSGO', 'Platts Diesel'];
  return pricingInstruments.includes(product);
};
