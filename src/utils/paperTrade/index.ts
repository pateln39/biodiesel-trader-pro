
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export all functions and types for backward compatibility
export * from './mtmTypes';
export * from './dateUtils';
export * from './priceUtils';
export * from './mtmCalculations';

// Import the formatDateForDatabase function from dateUtils
import { formatDateForDatabase } from './dateUtils';

// Utility function to get month start and end dates from a period string (e.g., 'Dec-23')
export const getMonthDates = (periodString: string): { startDate: Date; endDate: Date } | null => {
  try {
    // Split the period string into month and year
    const [month, year] = periodString.split('-');
    
    // Map month name to month index (0-11)
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      .findIndex(m => m === month);
    
    if (monthIndex === -1) {
      console.error(`Invalid month format in period string: ${periodString}`);
      return null;
    }
    
    // Year is in format 'XX', so prefix with '20' to get full year
    const fullYear = 2000 + parseInt(year);
    
    // Create start date (1st of the month)
    const startDate = new Date(fullYear, monthIndex, 1);
    
    // Create end date (last day of the month)
    const endDate = new Date(fullYear, monthIndex + 1, 0);
    
    return { startDate, endDate };
  } catch (error) {
    console.error(`Error parsing period string: ${periodString}`, error);
    return null;
  }
};

// Add a new helper function to calculate daily distribution
export const calculateDailyDistribution = (
  period: string,
  product: string,
  quantity: number,
  buySell: string
): Record<string, Record<string, number>> => {
  const monthDates = getMonthDates(period);
  if (!monthDates) {
    return {};
  }
  
  // Calculate business days
  const { startDate, endDate } = monthDates;
  const businessDays = getBusinessDaysCount(startDate, endDate);
  
  if (businessDays === 0) {
    return {};
  }
  
  // Use the quantity directly - preserving its sign
  const exposureValue = quantity;
  const dailyExposure = exposureValue / businessDays;
  
  // Create distribution object
  const distribution: Record<string, Record<string, number>> = {};
  distribution[product] = {};
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Not weekend
      const dateStr = formatDateForDatabase(currentDate); // Use our timezone-safe formatter
      distribution[product][dateStr] = dailyExposure;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return distribution;
};

// Helper function to count business days
export const getBusinessDaysCount = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Check if day is not a weekend (0 = Sunday, 6 = Saturday)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

// Fixed function to normalize trade exposures for paper trade legs
// Now correctly preserves the sign of right-side quantities
export const normalizeTradeExposures = (
  leg: any
): { paper: Record<string, number>, pricing: Record<string, number> } => {
  const exposures = {
    paper: {} as Record<string, number>,
    pricing: {} as Record<string, number>
  };
  
  const buySellMultiplier = leg.buySell === 'buy' ? 1 : -1;
  
  // Process the main product (left side)
  const leftProduct = leg.product;
  const leftQuantity = (leg.quantity || 0) * buySellMultiplier;
  
  exposures.paper[leftProduct] = leftQuantity;
  exposures.pricing[leftProduct] = leftQuantity;
  
  // Process right side for DIFF or SPREAD relationships
  if ((leg.relationshipType === 'DIFF' || leg.relationshipType === 'SPREAD') && leg.rightSide) {
    const rightProduct = leg.rightSide.product;
    
    // Important: Use the rightSide quantity directly - it already has the correct sign
    // The UI component already sets it as negative of left side
    const rightQuantity = leg.rightSide.quantity * buySellMultiplier;
    
    exposures.paper[rightProduct] = rightQuantity;
    exposures.pricing[rightProduct] = rightQuantity;
  }
  
  return exposures;
};

// Add a function to calculate and return complete exposures object
export const buildCompleteExposuresObject = (
  leg: any
): Record<string, any> => {
  // Get normalized paper and pricing exposures
  const { paper, pricing } = normalizeTradeExposures(leg);
  
  // Create the exposures object
  const exposuresObj = {
    physical: {}, // Always empty for paper trades
    paper,
    pricing,
    paperDailyDistribution: {},
    pricingDailyDistribution: {}
  };
  
  // Calculate daily distributions if period is available
  if (leg.period) {
    // For each product in paper exposures, calculate daily distribution
    Object.entries(paper).forEach(([product, quantity]) => {
      // We pass the quantity directly since it already has the correct sign
      const dailyDist = calculateDailyDistribution(leg.period, product, quantity, 'buy');
      
      if (Object.keys(dailyDist).length > 0) {
        // For paperDailyDistribution
        exposuresObj.paperDailyDistribution = {
          ...exposuresObj.paperDailyDistribution,
          ...dailyDist
        };
        
        // For pricingDailyDistribution
        exposuresObj.pricingDailyDistribution = {
          ...exposuresObj.pricingDailyDistribution,
          ...dailyDist
        };
      }
    });
  }
  
  return exposuresObj;
};
