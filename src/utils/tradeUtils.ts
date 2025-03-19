
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
export const generateLegReference = (tradeReference: string, rowIndex: number, side: 'A' | 'B'): string => {
  return `${tradeReference}-${rowIndex}${side}`;
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

// Get month key from date for exposure calculations
export const getMonthKey = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('default', { month: 'short' }).slice(0, 3);
};

// Calculate paper trade exposures from trade rows
export const calculatePaperExposures = (
  rows: any[], 
  products: string[]
): Record<string, Record<string, number>> => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Initialize exposures object
  const exposures: Record<string, Record<string, number>> = {};
  months.forEach(month => {
    exposures[month] = {};
    products.forEach(product => {
      exposures[month][product] = 0;
    });
  });
  
  // Process each row's legs
  rows.forEach(row => {
    if (row.legA) {
      processLegExposure(row.legA, exposures, products);
    }
    
    if (row.legB) {
      processLegExposure(row.legB, exposures, products);
    }
  });
  
  return exposures;
};

// Helper function to process a single leg's exposure
const processLegExposure = (
  leg: any, 
  exposures: Record<string, Record<string, number>>, 
  products: string[]
) => {
  if (!leg.pricingPeriodStart || !products.includes(leg.product)) return;
  
  const month = getMonthKey(leg.pricingPeriodStart);
  const sign = leg.buySell === 'buy' ? 1 : -1;
  const quantity = leg.quantity || 0;
  
  if (exposures[month] && exposures[month][leg.product] !== undefined) {
    exposures[month][leg.product] += quantity * sign;
  }
};
