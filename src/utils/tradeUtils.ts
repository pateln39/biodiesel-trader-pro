
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
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Calculate net exposure from physical, pricing, and paper positions
export const calculateNetExposure = (
  physical: number,
  pricing: number,
  paper: number
): number => {
  return physical + pricing + paper;
};
