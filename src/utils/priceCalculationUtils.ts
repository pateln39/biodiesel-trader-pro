
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
  // Find the instrument_id based on the display_name
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('display_name', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error(`Error finding instrument ${instrument}:`, instrumentError);
    return [];
  }

  const instrumentId = instrumentData.id;

  const { data, error } = await supabase
    .from('historical_prices')
    .select('price_date, price')
    .eq('instrument_id', instrumentId)
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
  // Find the instrument_id based on the display_name
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('display_name', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error(`Error finding instrument ${instrument}:`, instrumentError);
    return [];
  }

  const instrumentId = instrumentData.id;

  const { data, error } = await supabase
    .from('forward_prices')
    .select('forward_month, price')
    .eq('instrument_id', instrumentId)
    .gte('forward_month', startDate.toISOString().split('T')[0])
    .lte('forward_month', endDate.toISOString().split('T')[0])
    .order('forward_month', { ascending: true });

  if (error) {
    console.error('Error fetching forward prices:', error);
    return [];
  }

  return data.map(item => ({
    date: new Date(item.forward_month),
    price: item.price
  }));
};

// Calculate average price for a collection of price points
export const calculateAveragePrice = (prices: { date: Date; price: number }[]): number => {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((total, { price }) => total + price, 0);
  return sum / prices.length;
};

// Evaluates a token in the formula
const evaluateToken = (
  token: FormulaToken, 
  instrumentPrices: Record<Instrument, number>
): number => {
  switch (token.type) {
    case 'instrument':
      return instrumentPrices[token.value as Instrument] || 0;
    case 'fixedValue':
      return parseFloat(token.value);
    default:
      return 0;
  }
};

// Apply formula to calculate the final price
export const applyPricingFormula = (
  formula: PricingFormula, 
  instrumentPrices: Record<Instrument, number>
): number => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) return 0;
  
  // For now, we're implementing a simple formula evaluation
  // that supports instruments and fixed values with basic operators
  let result = 0;
  let currentOp = '+';
  
  for (let i = 0; i < formula.tokens.length; i++) {
    const token = formula.tokens[i];
    
    if (token.type === 'operator') {
      currentOp = token.value;
    } else {
      const value = evaluateToken(token, instrumentPrices);
      
      if (currentOp === '+') {
        result += value;
      } else if (currentOp === '-') {
        result -= value;
      } else if (currentOp === '*') {
        result *= value;
      } else if (currentOp === '/') {
        if (value !== 0) {
          result /= value;
        } else {
          console.error('Division by zero in formula');
        }
      }
    }
  }
  
  return result;
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
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return {
      price: 0,
      periodType: 'historical',
      priceDetails: {}
    };
  }
  
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

  // Track which instruments are used in the formula for exposure calculation
  const usedInstruments = new Set<Instrument>();

  // Collect price data for each instrument in the formula
  for (const token of formula.tokens) {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      usedInstruments.add(instrument);
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
  
  // Only return price details for instruments actually used in the formula
  const filteredPriceDetails: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }> = 
    Object.fromEntries(
      Object.entries(priceDetails)
        .filter(([instrument]) => usedInstruments.has(instrument as Instrument))
    ) as Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  
  return {
    price: finalPrice,
    periodType,
    priceDetails: filteredPriceDetails
  };
};

// Calculate MTM value based on trade price and MTM price
export const calculateMTMValue = (
  tradePrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  // The new MTM calculation: (tradePrice - mtmPrice) * quantity * buySellFactor
  const buySellFactor = buySell.toLowerCase() === 'buy' ? -1 : 1;
  
  return (tradePrice - mtmPrice) * quantity * buySellFactor;
};

// Update a trade leg's price in the database
export const updateTradeLegPrice = async (
  legId: string, 
  price: number,
  mtmPrice?: number
): Promise<boolean> => {
  const updates: any = { 
    calculated_price: price,
    last_calculation_date: new Date().toISOString()
  };
  
  // If MTM price is provided, update that too
  if (mtmPrice !== undefined) {
    updates.mtm_calculated_price = mtmPrice;
    updates.mtm_last_calculation_date = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('trade_legs')
    .update(updates)
    .eq('id', legId);
  
  if (error) {
    console.error('Error updating trade leg price:', error);
    return false;
  }
  
  return true;
};

// Calculate exposure for a trade with the given formula and quantity
export const calculateExposure = (
  formula: PricingFormula,
  quantity: number,
  buySell: 'buy' | 'sell'
): Record<Instrument, number> => {
  const exposure: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };
  
  if (!formula || !formula.tokens) return exposure;
  
  // Direction multiplier: buy = -1 (we are exposed to price increases)
  // sell = 1 (we are exposed to price decreases)
  const directionMultiplier = buySell.toLowerCase() === 'buy' ? -1 : 1;
  
  // For each instrument in the formula, calculate exposure
  formula.tokens.forEach(token => {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      // Simple exposure calculation: quantity * direction
      exposure[instrument] = quantity * directionMultiplier;
    }
  });
  
  return exposure;
};
