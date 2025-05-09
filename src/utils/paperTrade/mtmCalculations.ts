
import { PaperTradeLeg } from '@/types/paper';
import { mapProductToCanonical } from '../productMapping';
import { getMonthDates, getPeriodType } from './dateUtils';
import { fetchMonthlyAveragePrice, fetchSpecificForwardPrice } from './priceUtils';
import { toast } from 'sonner';

/**
 * Calculate the trade price for a paper trade leg
 * For FP trades: simply the price entered by the user
 * For DIFF/SPREAD trades: the difference between left price and right price
 * @param leg - Paper trade leg object
 * @returns Calculated price for the trade
 */
export const calculatePaperTradePrice = (leg: PaperTradeLeg): number => {
  if (!leg) return 0;
  
  // For FP trades, just return the price
  if (leg.relationshipType === 'FP') {
    return leg.price || 0;
  }
  
  // For DIFF and SPREAD trades, return the difference between left and right prices
  const leftPrice = leg.price || 0;
  const rightPrice = leg.rightSide?.price || 0;
  return leftPrice - rightPrice;
};

/**
 * Calculate the MTM price for a paper trade leg
 * @param leg - Paper trade leg object
 * @param today - Reference date (defaults to current date)
 * @returns Promise resolving to calculated MTM price or null if calculation fails
 */
export const calculatePaperMTMPrice = async (
  leg: PaperTradeLeg,
  today: Date = new Date()
): Promise<number | null> => {
  if (!leg || !leg.period) {
    console.error(`Missing required data for leg ${leg?.legReference}: no period specified`);
    return null;
  }
  
  // Get the month dates
  const dates = getMonthDates(leg.period);
  if (!dates) {
    console.error(`Invalid period format for leg ${leg.legReference}: ${leg.period}`);
    return null;
  }
  
  const { startDate, endDate } = dates;
  
  // Determine period type
  const periodType = getPeriodType(startDate, endDate, today);
  
  // Map product codes to canonical format
  const leftProduct = mapProductToCanonical(leg.product);
  console.log(`Mapped left product ${leg.product} to: ${leftProduct}`);
  
  let rightProduct = null;
  
  if (leg.relationshipType === 'DIFF') {
    // For DIFF trades, right side is always LSGO
    rightProduct = 'Platts LSGO';
    console.log(`DIFF relationship detected - right product automatically set to: ${rightProduct}`);
  } else if (leg.relationshipType === 'SPREAD' && leg.rightSide) {
    rightProduct = mapProductToCanonical(leg.rightSide.product);
    console.log(`SPREAD relationship detected - mapped right product ${leg.rightSide.product} to: ${rightProduct}`);
  }

  console.log(`Calculating MTM price for leg ${leg.legReference} with products: ${leftProduct}${rightProduct ? ' and ' + rightProduct : ''}`);
  console.log(`Period: ${leg.period} (${periodType}), Relationship Type: ${leg.relationshipType}`);
  
  try {
    // For past periods, use historical data
    if (periodType === 'past') {
      console.log(`Using historical data for ${leg.period} (past period)`);
      // For FP trades
      if (leg.relationshipType === 'FP') {
        return await fetchMonthlyAveragePrice(leftProduct, leg.period);
      } 
      
      // For DIFF and SPREAD trades
      const leftPrice = await fetchMonthlyAveragePrice(leftProduct, leg.period);
      if (leftPrice === null) {
        console.error(`Failed to get historical price for ${leftProduct} for period ${leg.period}`);
        return null;
      }
      
      if (rightProduct) {
        const rightPrice = await fetchMonthlyAveragePrice(rightProduct, leg.period);
        if (rightPrice === null) {
          console.error(`Failed to get historical price for ${rightProduct} for period ${leg.period}`);
          return null;
        }
        
        console.log(`Calculated differential price: ${leftProduct} (${leftPrice}) - ${rightProduct} (${rightPrice}) = ${leftPrice - rightPrice}`);
        return leftPrice - rightPrice;
      }
      
      return leftPrice;
    } 
    
    // For current and future periods, use forward data
    else {
      console.log(`Using forward data for ${leg.period} (${periodType} period)`);
      // For FP trades
      if (leg.relationshipType === 'FP') {
        return await fetchSpecificForwardPrice(leftProduct, leg.period);
      }
      
      // For DIFF and SPREAD trades
      const leftPrice = await fetchSpecificForwardPrice(leftProduct, leg.period);
      if (leftPrice === null) {
        console.error(`Failed to get forward price for ${leftProduct} for period ${leg.period}`);
        return null;
      }
      
      if (rightProduct) {
        const rightPrice = await fetchSpecificForwardPrice(rightProduct, leg.period);
        if (rightPrice === null) {
          console.error(`Failed to get forward price for ${rightProduct} for period ${leg.period}`);
          return null;
        }
        
        console.log(`Calculated differential price: ${leftProduct} (${leftPrice}) - ${rightProduct} (${rightPrice}) = ${leftPrice - rightPrice}`);
        return leftPrice - rightPrice;
      }
      
      return leftPrice;
    }
  } catch (error) {
    console.error(`Error in calculatePaperMTMPrice for ${leg.legReference}:`, error);
    toast.error(`Failed to calculate MTM price for ${leg.legReference}`, {
      description: "Please check logs for details"
    });
    return null;
  }
};

/**
 * Calculate MTM value for a paper trade leg
 * @param tradePrice - Original trade price
 * @param mtmPrice - Current MTM price
 * @param quantity - Trade quantity
 * @param buySell - Buy or sell direction
 * @returns Calculated MTM value
 */
export const calculatePaperMTMValue = (
  tradePrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  // Use the same calculation logic as physical trades
  const directionFactor = buySell === 'buy' ? -1 : 1;
  return (tradePrice - mtmPrice) * quantity * directionFactor;
};
