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
  // Extract the base trade reference
  const tradeRef = tradeReference.split('-')[0];
  
  // Extract the numeric part from the trade reference
  const numericPart = tradeReference.split('-')[1] || '';
  
  // Extract the leg suffix (e.g., 'a', 'b') from the leg reference
  let legSuffix = '';
  if (legReference && legReference.includes('-')) {
    legSuffix = legReference.split('-').pop() || '';
  }
  
  // Format the movement reference including the leg suffix
  return `${tradeRef}-${numericPart}-${legSuffix}-${movementCount}`;
};

// Format a movement reference for display
export const formatMovementReference = (tradeReference: string, legReference: string, movementNumber: string | number): string => {
  // Extract the leg suffix if it exists
  let legSuffix = '';
  if (legReference && legReference.includes('-')) {
    legSuffix = legReference.split('-').pop() || '';
  }
  
  // Check if the movement number already includes the leg reference
  if (typeof movementNumber === 'string' && movementNumber.includes(`-${legSuffix}-`)) {
    return movementNumber;
  }
  
  // Extract the base parts from the trade reference
  const parts = tradeReference.split('-');
  const dateCode = parts[0];
  const randomCode = parts[1];
  
  // Format with leg suffix included
  return `${dateCode}-${randomCode}-${legSuffix}-${movementNumber}`;
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

// Calculate net exposure for a product
export const calculateNetExposure = (physical: number, pricing: number): number => {
  // Net exposure = physical + pricing
  // This calculation is used by the exposure table to determine total risk position
  const result = physical + pricing;
  
  // Log calculations when they're non-zero for debugging
  if (physical !== 0 || pricing !== 0) {
    console.log(`Net exposure calculation: ${physical} (physical) + ${pricing} (pricing) = ${result}`);
  }
  
  return result;
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

// Utility function to debug trade exposure
export const debugTradeExposure = (trade: any, leg: any): void => {
  console.group(`Trade Exposure Debug: ${trade.tradeReference} / Leg: ${leg.legReference}`);
  console.log('Trade buy/sell:', leg.buySell);
  console.log('Product:', leg.product);
  console.log('Quantity:', leg.quantity);
  console.log('Tolerance:', leg.tolerance || 0);
  
  const calculatedVolume = leg.quantity * (1 + (leg.tolerance || 0) / 100);
  console.log('Calculated volume with tolerance:', calculatedVolume);
  
  console.log('Loading period start:', leg.loadingPeriodStart);
  console.log('Pricing period start:', leg.pricingPeriodStart);
  
  if (leg.formula) {
    console.log('Formula tokens:', leg.formula.tokens);
    console.log('Formula exposures:', leg.formula.exposures);
    console.log('Monthly distribution:', leg.formula.monthlyDistribution);
  } else {
    console.log('No formula found!');
  }
  
  console.groupEnd();
};
