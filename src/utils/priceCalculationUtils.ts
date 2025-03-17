import { FormulaToken, Instrument, PricingFormula, FixedComponent, PriceDetail, MTMPriceDetail } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { formulaToDisplayString } from './formulaUtils';

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

// New function to fetch the most recent price for a given instrument
export const fetchMostRecentPrice = async (
  instrument: Instrument
): Promise<{ date: Date; price: number } | null> => {
  // Find the instrument_id based on the display_name
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('display_name', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error(`Error finding instrument ${instrument}:`, instrumentError);
    return null;
  }

  const instrumentId = instrumentData.id;

  // Try to get the most recent historical price first
  const { data: histData, error: histError } = await supabase
    .from('historical_prices')
    .select('price_date, price')
    .eq('instrument_id', instrumentId)
    .order('price_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no historical price is found, check forward prices
  if (!histData && !histError) {
    const { data: fwdData, error: fwdError } = await supabase
      .from('forward_prices')
      .select('forward_month, price')
      .eq('instrument_id', instrumentId)
      .order('forward_month', { ascending: true }) // Get the closest forward month
      .limit(1)
      .maybeSingle();

    if (fwdError || !fwdData) {
      console.error(`No recent price found for instrument ${instrument}`);
      return null;
    }

    return {
      date: new Date(fwdData.forward_month),
      price: fwdData.price
    };
  }

  if (histError) {
    console.error('Error fetching most recent price:', histError);
    return null;
  }

  if (histData) {
    return {
      date: new Date(histData.price_date),
      price: histData.price
    };
  }

  return null;
};

// Calculate average price for a collection of price points
export const calculateAveragePrice = (prices: { date: Date; price: number }[]): number => {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((total, { price }) => total + price, 0);
  return sum / prices.length;
};

// Extract fixed components from formula tokens
const extractFixedComponents = (tokens: FormulaToken[]): FixedComponent[] => {
  const fixedComponents: FixedComponent[] = [];
  
  tokens.forEach((token, index) => {
    if (token.type === 'fixedValue') {
      // Check if this is part of an operation with the surrounding tokens
      const prevToken = index > 0 ? tokens[index - 1] : null;
      const nextToken = index < tokens.length - 1 ? tokens[index + 1] : null;
      
      // For display purposes, include the operator if it exists
      let displayValue = token.value;
      
      if (prevToken && prevToken.type === 'operator') {
        displayValue = `${prevToken.value}${token.value}`;
      } else if (nextToken && nextToken.type === 'operator') {
        // Only prefix with + if it's not already signed
        if (!displayValue.startsWith('-') && !displayValue.startsWith('+')) {
          displayValue = `+${displayValue}`;
        }
      }
      
      fixedComponents.push({
        value: parseFloat(token.value),
        displayValue
      });
    }
  });
  
  return fixedComponents;
};

// Parse and evaluate a formula token
const evaluateFormula = (
  tokens: FormulaToken[],
  instrumentPrices: Record<Instrument, number>
): number => {
  if (!tokens || tokens.length === 0) return 0;
  
  // Process tokens to handle implied multiplication, etc.
  let position = 0;
  
  // Parse expression with operator precedence (addition, subtraction)
  const parseExpression = (): number => {
    let left = parseTerm();
    
    while (position < tokens.length && 
          (tokens[position].type === 'operator' && 
           (tokens[position].value === '+' || tokens[position].value === '-'))) {
      const operator = tokens[position].value;
      position++;
      const right = parseTerm();
      
      if (operator === '+') {
        left += right;
      } else if (operator === '-') {
        left -= right;
      }
    }
    
    return left;
  };
  
  // Parse term (multiplication, division)
  const parseTerm = (): number => {
    let left = parseFactor();
    
    while (position < tokens.length && 
          (tokens[position].type === 'operator' && 
           (tokens[position].value === '*' || tokens[position].value === '/'))) {
      const operator = tokens[position].value;
      position++;
      const right = parseFactor();
      
      if (operator === '*') {
        left *= right;
      } else if (operator === '/') {
        if (right !== 0) {
          left /= right;
        } else {
          console.error('Division by zero in formula');
        }
      }
    }
    
    // Check for percentage after a term
    if (position < tokens.length && tokens[position].type === 'percentage') {
      const percentValue = parseFloat(tokens[position].value) / 100;
      left *= percentValue;
      position++;
    }
    
    return left;
  };
  
  // Parse factor (value, parenthesized expression)
  const parseFactor = (): number => {
    if (position >= tokens.length) {
      return 0;
    }
    
    const token = tokens[position];
    
    if (token.type === 'openBracket') {
      position++; // Skip open bracket
      const value = parseExpression();
      
      if (position < tokens.length && tokens[position].type === 'closeBracket') {
        position++; // Skip close bracket
      }
      
      // Check for percentage after parenthesis
      if (position < tokens.length && tokens[position].type === 'percentage') {
        const percentValue = parseFloat(tokens[position].value) / 100;
        position++;
        return value * percentValue;
      }
      
      return value;
    } else if (token.type === 'instrument') {
      position++;
      const instrumentValue = instrumentPrices[token.value as Instrument] || 0;
      
      // Check for percentage after instrument
      if (position < tokens.length && tokens[position].type === 'percentage') {
        const percentValue = parseFloat(tokens[position].value) / 100;
        position++;
        return instrumentValue * percentValue;
      }
      
      return instrumentValue;
    } else if (token.type === 'fixedValue') {
      position++;
      const value = parseFloat(token.value);
      
      // Check for percentage after fixed value
      if (position < tokens.length && tokens[position].type === 'percentage') {
        const percentValue = parseFloat(tokens[position].value) / 100;
        position++;
        return value * percentValue;
      }
      
      return value;
    } else if (token.type === 'percentage') {
      position++;
      return parseFloat(token.value) / 100;
    } else if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
      // Unary plus or minus
      position++;
      const factor = parseFactor();
      return token.value === '-' ? -factor : factor;
    }
    
    // Skip unknown tokens
    position++;
    return 0;
  };
  
  const result = parseExpression();
  return result;
};

// Apply formula to calculate the final price
export const applyPricingFormula = (
  formula: PricingFormula, 
  instrumentPrices: Record<Instrument, number>
): number => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) return 0;
  
  try {
    return evaluateFormula(formula.tokens, instrumentPrices);
  } catch (error) {
    console.error('Error evaluating formula:', error);
    return 0;
  }
};

// Calculate trade leg price based on its formula and date range
export const calculateTradeLegPrice = async (
  formula: PricingFormula,
  startDate: Date,
  endDate: Date
): Promise<{
  price: number;
  periodType: PricingPeriodType;
  priceDetails: PriceDetail;
}> => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return {
      price: 0,
      periodType: 'historical',
      priceDetails: {
        instruments: {},
        fixedComponents: [],
        evaluatedPrice: 0
      }
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

  // Extract fixed components from the formula
  const fixedComponents = extractFixedComponents(formula.tokens);

  // Track which instruments are used in the formula for exposure calculation
  const usedInstruments = new Set<Instrument>();
  let hasInstrument = false;

  // Collect price data for each instrument in the formula
  for (const token of formula.tokens) {
    if (token.type === 'instrument') {
      hasInstrument = true;
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
  
  // If there are no instruments but there are fixed values, create a default date range
  if (!hasInstrument && fixedComponents.length > 0) {
    // Create a synthetic price series covering the pricing period
    const syntheticDates: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Generate dates covering the pricing period
    while (currentDate <= endDate) {
      syntheticDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Use the first instrument as a placeholder
    const placeholderInstrument = 'Argus UCOME' as Instrument;
    usedInstruments.add(placeholderInstrument);
    
    // Create synthetic price points with value 0
    const syntheticPrices = syntheticDates.map(date => ({ 
      date, 
      price: 0 
    }));
    
    priceDetails[placeholderInstrument] = { 
      average: 0, 
      prices: syntheticPrices
    };
  }
  
  // Apply the formula to calculate the final price
  const finalPrice = applyPricingFormula(formula, instrumentPrices);
  
  // Only include instruments that were used in the formula
  const filteredInstruments = Object.fromEntries(
    Object.entries(priceDetails)
      .filter(([instrument]) => usedInstruments.has(instrument as Instrument))
  ) as Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  
  return {
    price: finalPrice,
    periodType,
    priceDetails: {
      instruments: filteredInstruments,
      fixedComponents,
      evaluatedPrice: finalPrice
    }
  };
};

// Calculate MTM price using most recent prices
export const calculateMTMPrice = async (
  formula: PricingFormula,
): Promise<{
  price: number;
  priceDetails: MTMPriceDetail;
}> => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return {
      price: 0,
      priceDetails: {
        instruments: {},
        fixedComponents: [],
        evaluatedPrice: 0
      }
    };
  }
  
  const instrumentPrices: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };
  
  const priceDetails: Record<Instrument, { price: number; date: Date | null }> = {
    'Argus UCOME': { price: 0, date: null },
    'Argus RME': { price: 0, date: null },
    'Argus FAME0': { price: 0, date: null },
    'Platts LSGO': { price: 0, date: null },
    'Platts diesel': { price: 0, date: null },
  };

  // Extract fixed components from the formula
  const fixedComponents = extractFixedComponents(formula.tokens);

  // Track which instruments are used in the formula
  const usedInstruments = new Set<Instrument>();
  let hasInstrument = false;

  // Collect most recent price data for each instrument in the formula
  for (const token of formula.tokens) {
    if (token.type === 'instrument') {
      hasInstrument = true;
      const instrument = token.value as Instrument;
      usedInstruments.add(instrument);
      
      // Fetch most recent price for this instrument
      const recentPrice = await fetchMostRecentPrice(instrument);
      
      if (recentPrice) {
        instrumentPrices[instrument] = recentPrice.price;
        priceDetails[instrument] = { price: recentPrice.price, date: recentPrice.date };
      } else {
        // If no price found, leave as 0
        instrumentPrices[instrument] = 0;
        priceDetails[instrument] = { price: 0, date: null };
      }
    }
  }
  
  // If there are no instruments but there are fixed values, create a default display entry
  if (!hasInstrument && fixedComponents.length > 0) {
    // Use today's date
    const today = new Date();
    
    // Use the first instrument as a placeholder
    const placeholderInstrument = 'Argus UCOME' as Instrument;
    usedInstruments.add(placeholderInstrument);
    
    priceDetails[placeholderInstrument] = { 
      price: 0, 
      date: today
    };
  }
  
  // Apply the formula to calculate the final price
  const finalPrice = applyPricingFormula(formula, instrumentPrices);
  
  // Filter the instruments to only those used in the formula
  const filteredInstruments = Object.fromEntries(
    Object.entries(priceDetails)
      .filter(([instrument]) => usedInstruments.has(instrument as Instrument))
  ) as Record<Instrument, { price: number; date: Date | null }>;
  
  return {
    price: finalPrice,
    priceDetails: {
      instruments: filteredInstruments,
      fixedComponents,
      evaluatedPrice: finalPrice
    }
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
