
import { supabase } from '@/integrations/supabase/client';
import { mapProductToCanonical, mapProductToInstrumentCode } from '../productMapping';
import { parseForwardMonth } from '../dateParsingUtils';
import { getMonthDates } from './dateUtils';

/**
 * Get instrument ID from its code, with better error handling
 * @param instrumentCode - Code of the instrument to look up
 * @returns Promise resolving to instrument ID or null if not found
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
 * @param instrumentCode - Code of the instrument
 * @param period - Period string in format MMM-YY
 * @returns Promise resolving to average price or null if not available
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
 * @param instrumentCode - Code of the instrument
 * @param period - Period string in format MMM-YY
 * @returns Promise resolving to forward price or null if not available
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
