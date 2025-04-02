import { PaperTrade, PaperTradeLeg } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { parseForwardMonth } from './dateParsingUtils';
import { mapProductToCanonical } from './productMapping';

/**
 * Calculate the trade price for a paper trade leg
 * For FP trades: simply the price entered by the user
 * For DIFF/SPREAD trades: the difference between left price and right price
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
 * Get the start and end date for a month period (MMM-YY)
 */
export const getMonthDates = (period: string): { startDate: Date, endDate: Date } | null => {
  if (!period) return null;
  
  try {
    const [month, yearStr] = period.split('-');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      .findIndex(m => m === month);
      
    if (monthIndex === -1 || !yearStr) return null;
    
    const year = 2000 + parseInt(yearStr);
    const startDate = new Date(year, monthIndex, 1);
    
    // Calculate the last day of the month
    const endDate = new Date(year, monthIndex + 1, 0);
    
    return { startDate, endDate };
  } catch (error) {
    console.error('Error parsing period:', error);
    return null;
  }
};

/**
 * Check if a date range is in the past, current, or future
 */
export const getPeriodType = (
  startDate: Date, 
  endDate: Date, 
  today: Date = new Date()
): 'past' | 'current' | 'future' => {
  // Set time to beginning of the day for consistent comparison
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  
  // If end date is before today, it's in the past
  if (endDate < todayStart) {
    return 'past';
  }
  
  // If start date is after today, it's in the future
  if (startDate > todayStart) {
    return 'future';
  }
  
  // Otherwise, it's the current period
  return 'current';
};

/**
 * Fetch the monthly average price from historical data for an instrument
 */
export const fetchMonthlyAveragePrice = async (
  instrumentCode: string, 
  period: string
): Promise<number | null> => {
  const dates = getMonthDates(period);
  if (!dates) return null;
  
  const { startDate, endDate } = dates;
  
  // First get the instrument ID
  const { data: instruments, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('instrument_code', instrumentCode)
    .single();
    
  if (instrumentError || !instruments) {
    console.error(`Error fetching instrument ID for ${instrumentCode}:`, instrumentError);
    return null;
  }
  
  const instrumentId = instruments.id;
  
  // Now fetch all prices in the date range
  const { data: prices, error: pricesError } = await supabase
    .from('historical_prices')
    .select('price')
    .eq('instrument_id', instrumentId)
    .gte('price_date', startDate.toISOString().split('T')[0])
    .lte('price_date', endDate.toISOString().split('T')[0]);
    
  if (pricesError) {
    console.error(`Error fetching prices for ${instrumentCode}:`, pricesError);
    return null;
  }
  
  // Calculate average price
  if (prices && prices.length > 0) {
    const sum = prices.reduce((acc, curr) => acc + Number(curr.price), 0);
    return sum / prices.length;
  }
  
  return null;
};

/**
 * Fetch the specific forward price for an instrument and period
 */
export const fetchSpecificForwardPrice = async (
  instrumentCode: string, 
  period: string
): Promise<number | null> => {
  // Parse the period to get the forward month
  const forwardMonth = parseForwardMonth(period);
  if (!forwardMonth) return null;
  
  // First get the instrument ID
  const { data: instruments, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('instrument_code', instrumentCode)
    .single();
    
  if (instrumentError || !instruments) {
    console.error(`Error fetching instrument ID for ${instrumentCode}:`, instrumentError);
    return null;
  }
  
  const instrumentId = instruments.id;
  
  // Now fetch the specific forward price
  const { data: forwardPrice, error: priceError } = await supabase
    .from('forward_prices')
    .select('price')
    .eq('instrument_id', instrumentId)
    .eq('forward_month', forwardMonth.toISOString().split('T')[0])
    .single();
    
  if (priceError) {
    console.error(`Error fetching forward price for ${instrumentCode} ${period}:`, priceError);
    
    // If no exact match, try to get the closest forward month
    const { data: latestPrice } = await supabase
      .from('forward_prices')
      .select('price')
      .eq('instrument_id', instrumentId)
      .order('forward_month', { ascending: false })
      .limit(1)
      .single();
      
    if (latestPrice) {
      return Number(latestPrice.price);
    }
    
    return null;
  }
  
  return Number(forwardPrice.price);
};

/**
 * Calculate the MTM price for a paper trade leg
 */
export const calculatePaperMTMPrice = async (
  leg: PaperTradeLeg,
  today: Date = new Date()
): Promise<number | null> => {
  if (!leg || !leg.period) return null;
  
  // Get the month dates
  const dates = getMonthDates(leg.period);
  if (!dates) return null;
  
  const { startDate, endDate } = dates;
  
  // Determine period type
  const periodType = getPeriodType(startDate, endDate, today);
  
  // Map product codes to canonical format
  const leftProduct = mapProductToCanonical(leg.product);
  let rightProduct = null;
  
  if (leg.relationshipType === 'DIFF') {
    rightProduct = 'Platts LSGO'; // Always LSGO for DIFF trades
  } else if (leg.relationshipType === 'SPREAD' && leg.rightSide) {
    rightProduct = mapProductToCanonical(leg.rightSide.product);
  }
  
  // For past periods, use historical data
  if (periodType === 'past') {
    // For FP trades
    if (leg.relationshipType === 'FP') {
      return await fetchMonthlyAveragePrice(leftProduct, leg.period);
    } 
    
    // For DIFF and SPREAD trades
    const leftPrice = await fetchMonthlyAveragePrice(leftProduct, leg.period);
    if (leftPrice === null) return null;
    
    if (rightProduct) {
      const rightPrice = await fetchMonthlyAveragePrice(rightProduct, leg.period);
      if (rightPrice === null) return null;
      
      return leftPrice - rightPrice;
    }
    
    return leftPrice;
  } 
  
  // For current and future periods, use forward data
  else {
    // For FP trades
    if (leg.relationshipType === 'FP') {
      return await fetchSpecificForwardPrice(leftProduct, leg.period);
    }
    
    // For DIFF and SPREAD trades
    const leftPrice = await fetchSpecificForwardPrice(leftProduct, leg.period);
    if (leftPrice === null) return null;
    
    if (rightProduct) {
      const rightPrice = await fetchSpecificForwardPrice(rightProduct, leg.period);
      if (rightPrice === null) return null;
      
      return leftPrice - rightPrice;
    }
    
    return leftPrice;
  }
};

/**
 * Calculate MTM value for a paper trade leg
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

// Type definition for paper MTM positions
export interface PaperMTMPosition {
  legId: string;
  tradeRef: string;
  legReference: string;
  buySell: string;
  product: string;
  quantity: number;
  period: string;
  relationshipType: string;
  calculatedPrice: number;
  mtmCalculatedPrice: number;
  mtmValue: number;
  periodType: 'past' | 'current' | 'future';
  rightSide?: {
    product: string;
    price?: number;
  };
}
