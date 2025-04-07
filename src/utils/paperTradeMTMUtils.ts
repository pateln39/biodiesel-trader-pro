
import { PaperMTMPosition } from "@/types/paper";

export type PeriodType = 'past' | 'current' | 'future';

export const getMonthDates = (
  period: string
): { startDate: Date; endDate: Date } | null => {
  try {
    // Period format is expected to be "MMM-YY" like "Apr-22"
    const [monthStr, yearStr] = period.split('-');
    
    const monthMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    
    if (!monthMap.hasOwnProperty(monthStr)) {
      console.warn(`Invalid month in period: ${period}`);
      return null;
    }
    
    const month = monthMap[monthStr];
    const year = 2000 + parseInt(yearStr);
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month
    
    return { startDate, endDate };
  } catch (error) {
    console.error(`Error parsing period ${period}:`, error);
    return null;
  }
};

export const getPeriodType = (
  startDate: Date,
  endDate: Date,
  referenceDate: Date
): PeriodType => {
  if (endDate < referenceDate) {
    return 'past';
  } else if (startDate > referenceDate) {
    return 'future';
  } else {
    return 'current';
  }
};

export const calculatePaperTradePrice = (leg: any): number => {
  // For fixed price trades, return the price
  if (leg.price) {
    return parseFloat(leg.price);
  }
  
  // Based on relationship type
  if (leg.relationshipType === 'FP') {
    return leg.price || 0;
  } else if (leg.relationshipType === 'DIFF' || leg.relationshipType === 'SPREAD') {
    // For differential trades, calculate the difference
    return leg.price || 0;
  }
  
  return 0;
};

export const calculatePaperMTMPrice = async (
  leg: any,
  referenceDate: Date
): Promise<number> => {
  // In a real implementation, we would fetch the market price
  // For now, just return a mock price
  
  // We could implement calls to a price API here
  return Math.floor(Math.random() * 300) + 700; // Random price between 700 and 1000
};

export const calculatePaperMTMValue = (
  tradePrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  const multiplier = buySell === 'buy' ? 1 : -1;
  return (mtmPrice - tradePrice) * quantity * multiplier;
};

export { type PaperMTMPosition };
