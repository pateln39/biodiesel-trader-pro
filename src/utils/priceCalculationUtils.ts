
import { FormulaToken, Instrument, PricingFormula } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Pricing period types
export type PricingPeriodType = 'historical' | 'current' | 'forward';

// Function to determine pricing period type based on start and end dates
export const determinePricingPeriodType = (
  startDate: Date,
  endDate: Date
): PricingPeriodType => {
  const currentDate = new Date();
  
  // If both dates are in the past
  if (endDate < currentDate) {
    return 'historical';
  }
  
  // If both dates are in the future
  if (startDate > currentDate) {
    return 'forward';
  }
  
  // If the current date falls within the period
  return 'current';
};

// Function to fetch historical prices for a given instrument and date range
export const fetchHistoricalPrices = async (
  instrument: Instrument,
  startDate: Date,
  endDate: Date
): Promise<{ date: Date; price: number }[]> => {
  const { data, error } = await supabase
    .from('historical_prices')
    .select('price_date, price')
    .eq('instrument_id', instrument)
    .gte('price_date', startDate.toISOString().split('T')[0])
    .lte('price_date', endDate.toISOString().split('T')[0])
    .order('price_date', { ascending: true });

  if (error) {
    console.error('Error fetching historical prices:', error);
    return [];
  }

  return data.map(item => ({
    date: new Date(item.price_date),
    price: item.price
  }));
};

// Function to fetch forward prices for a given instrument and date range
export const fetchForwardPrices = async (
  instrument: Instrument,
  startDate: Date,
  endDate: Date
): Promise<{ date: Date; price: number }[]> => {
  const { data, error } = await supabase
    .from('forward_prices')
    .select('price_date, price')
    .eq('instrument_id', instrument)
    .gte('price_date', startDate.toISOString().split('T')[0])
    .lte('price_date', endDate.toISOString().split('T')[0])
    .order('price_date', { ascending: true });

  if (error) {
    console.error('Error fetching forward prices:', error);
    return [];
  }

  return data.map(item => ({
    date: new Date(item.price_date),
    price: item.price
  }));
};

// Calculate average price for a collection of price points
export const calculateAveragePrice = (prices: { date: Date; price: number }[]): number => {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((total, { price }) => total + price, 0);
  return sum / prices.length;
};

// Apply formula to calculate the final price
export const applyPricingFormula = (
  formula: PricingFormula, 
  instrumentPrices: Record<Instrument, number>
): number => {
  // For simple implementation, we'll just use the first instrument
  // In a real implementation, this would evaluate the formula tokens
  if (formula.tokens.length === 0) return 0;
  
  // Find the first instrument token
  const instrumentToken = formula.tokens.find(token => token.type === 'instrument');
  if (!instrumentToken) return 0;
  
  const instrument = instrumentToken.value as Instrument;
  return instrumentPrices[instrument] || 0;
};

// Calculate trade leg price based on its formula and date range
export const calculateTradeLegPrice = async (
  formula: PricingFormula,
  startDate: Date,
  endDate: Date
): Promise<{
  price: number;
  periodType: PricingPeriodType;
  priceDetails: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
}> => {
  const periodType = determinePricingPeriodType(startDate, endDate);
  const instrumentPrices: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };
  
  const priceDetails: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }> = {
    'Argus UCOME': { average: 0, prices: [] },
    'Argus RME': { average: 0, prices: [] },
    'Argus FAME0': { average: 0, prices: [] },
    'Platts LSGO': { average: 0, prices: [] },
    'Platts diesel': { average: 0, prices: [] },
  };

  // Collect price data for each instrument in the formula
  for (const token of formula.tokens) {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      let prices: { date: Date; price: number }[] = [];
      
      // Fetch appropriate prices based on period type
      if (periodType === 'historical' || periodType === 'current') {
        prices = await fetchHistoricalPrices(instrument, startDate, endDate);
      } else {
        prices = await fetchForwardPrices(instrument, startDate, endDate);
      }
      
      const average = calculateAveragePrice(prices);
      
      instrumentPrices[instrument] = average;
      priceDetails[instrument] = { average, prices };
    }
  }
  
  // Apply the formula to calculate the final price
  const finalPrice = applyPricingFormula(formula, instrumentPrices);
  
  return {
    price: finalPrice,
    periodType,
    priceDetails
  };
};

// Update a trade leg's price in the database
export const updateTradeLegPrice = async (
  legId: string, 
  price: number
): Promise<boolean> => {
  const { error } = await supabase
    .from('trade_legs')
    .update({ 
      calculated_price: price,
      last_calculation_date: new Date().toISOString()
    })
    .eq('id', legId);
  
  if (error) {
    console.error('Error updating trade leg price:', error);
    return false;
  }
  
  return true;
};
