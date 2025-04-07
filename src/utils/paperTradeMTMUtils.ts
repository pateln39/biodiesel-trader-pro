import { PaperTrade, PaperTradeLeg } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { parseForwardMonth } from './dateParsingUtils';
import { mapProductToCanonical, mapProductToInstrumentCode } from './productMapping';
import { toast } from 'sonner';

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
 * Get instrument ID from its code, with better error handling
 */
export const getInstrumentId = async (instrumentCode: string): Promise<string | null> => {
  console.log(`Fetching instrument ID for ${instrumentCode}`);

  // Map the product name to the instrument code in the database
  const dbInstrumentCode = mapProductToInstrumentCode(instrumentCode);
  console.log(`Mapped ${instrumentCode} to database instrument code: ${dbInstrumentCode}`);
  
  try {
    const { data: instruments, error } = await supabase
      .from('pricing_instruments')
      .select('id')
      .eq('instrument_code', dbInstrumentCode);
      
    if (error) {
      console.error(`Error fetching instrument ID for ${dbInstrumentCode}:`, error);
      return null;
    }
    
    if (!instruments || instruments.length === 0) {
      console.warn(`No instrument found with code ${dbInstrumentCode}`);
      
      // Fallback: Try a fuzzy match (case insensitive) as a last resort
      const { data: fuzzyMatches, error: fuzzyError } = await supabase
        .from('pricing_instruments')
        .select('id, instrument_code')
        .ilike('instrument_code', `%${dbInstrumentCode.replace('_', '%')}%`);
        
      if (fuzzyError || !fuzzyMatches || fuzzyMatches.length === 0) {
        console.error(`No fuzzy matches found for ${dbInstrumentCode}`);
        return null;
      }
      
      console.log(`Found fuzzy match for ${dbInstrumentCode}: ${fuzzyMatches[0].instrument_code}`);
      return fuzzyMatches[0].id;
    }
    
    console.log(`Found instrument ID for ${dbInstrumentCode}: ${instruments[0].id}`);
    return instruments[0].id;
  } catch (e) {
    console.error(`Exception fetching instrument ID for ${dbInstrumentCode}:`, e);
    return null;
  }
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
  
  // Get the instrument ID
  const instrumentId = await getInstrumentId(instrumentCode);
  if (!instrumentId) {
    console.warn(`Could not find instrument ID for ${instrumentCode}`);
    return null;
  }
  
  try {
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
      const average = sum / prices.length;
      console.log(`Calculated average price for ${instrumentCode} (${period}): ${average} from ${prices.length} data points`);
      return average;
    } else {
      console.warn(`No historical prices found for ${instrumentCode} in period ${period}`);
      return null;
    }
  } catch (e) {
    console.error(`Exception in fetchMonthlyAveragePrice for ${instrumentCode}:`, e);
    return null;
  }
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
  if (!forwardMonth || !forwardMonth.date) return null;
  
  // Get the instrument ID
  const instrumentId = await getInstrumentId(instrumentCode);
  if (!instrumentId) {
    console.warn(`Could not find instrument ID for ${instrumentCode}`);
    return null;
  }
  
  try {
    // Format the date for DB query
    const forwardMonthStr = `${forwardMonth.date.getFullYear()}-${String(forwardMonth.date.getMonth() + 1).padStart(2, '0')}-01`;
    
    // Now fetch the specific forward price
    const { data: forwardPrices, error: priceError } = await supabase
      .from('forward_prices')
      .select('price')
      .eq('instrument_id', instrumentId)
      .eq('forward_month', forwardMonthStr);
      
    if (priceError) {
      console.error(`Error fetching forward price for ${instrumentCode} ${period}:`, priceError);
      return null;
    }
    
    if (!forwardPrices || forwardPrices.length === 0) {
      console.warn(`No forward price found for ${instrumentCode} ${period}`);
      
      // If no exact match, try to get the closest forward month
      const { data: latestPrices } = await supabase
        .from('forward_prices')
        .select('price')
        .eq('instrument_id', instrumentId)
        .order('forward_month', { ascending: false })
        .limit(1);
        
      if (latestPrices && latestPrices.length > 0) {
        console.log(`Using latest price for ${instrumentCode}: ${Number(latestPrices[0].price)}`);
        return Number(latestPrices[0].price);
      }
      
      return null;
    }
    
    console.log(`Found forward price for ${instrumentCode} (${period}): ${Number(forwardPrices[0].price)}`);
    return Number(forwardPrices[0].price);
  } catch (e) {
    console.error(`Exception in fetchSpecificForwardPrice for ${instrumentCode}:`, e);
    return null;
  }
};

/**
 * Calculate the MTM price for a paper trade leg
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
