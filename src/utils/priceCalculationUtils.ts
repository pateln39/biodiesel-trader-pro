import { FormulaToken, Instrument, PricingFormula } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { validateFormula } from './formulaUtils';

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

// Evaluates a simple expression in a formula
const evaluateExpression = (
  tokens: FormulaToken[],
  instrumentPrices: Record<Instrument, number>
): number => {
  if (tokens.length === 0) return 0;
  
  // Handle single token case
  if (tokens.length === 1) {
    return evaluateToken(tokens[0], instrumentPrices);
  }
  
  // First, handle brackets to establish order of operations
  const tokensWithBrackets = [...tokens];
  while (tokensWithBrackets.some(t => t.type === 'openBracket')) {
    // Find matching brackets
    let openIndex = -1;
    let closeIndex = -1;
    let bracketLevel = 0;
    
    for (let i = 0; i < tokensWithBrackets.length; i++) {
      if (tokensWithBrackets[i].type === 'openBracket') {
        if (bracketLevel === 0) {
          openIndex = i;
        }
        bracketLevel++;
      } else if (tokensWithBrackets[i].type === 'closeBracket') {
        bracketLevel--;
        if (bracketLevel === 0) {
          closeIndex = i;
          break;
        }
      }
    }
    
    if (openIndex >= 0 && closeIndex > openIndex) {
      // Extract the expression inside brackets
      const innerExpression = tokensWithBrackets.slice(openIndex + 1, closeIndex);
      // Evaluate the inner expression
      const result = evaluateExpression(innerExpression, instrumentPrices);
      
      // Replace the bracket and its contents with the result
      tokensWithBrackets.splice(
        openIndex, 
        closeIndex - openIndex + 1, 
        {
          id: 'result-' + Math.random().toString(36).substring(2, 9),
          type: 'fixedValue',
          value: result.toString()
        }
      );
    } else {
      // Error in bracket matching - should not happen if formula is valid
      console.error('Bracket matching error in formula evaluation');
      break;
    }
  }
  
  // Handle percentages
  const tokensWithPercentages = [...tokensWithBrackets];
  for (let i = 0; i < tokensWithPercentages.length; i++) {
    if (tokensWithPercentages[i].type === 'percentage' && i > 0) {
      const percentValue = parseFloat(tokensWithPercentages[i].value) / 100;
      const prevToken = tokensWithPercentages[i - 1];
      
      if (prevToken.type === 'fixedValue' || prevToken.type === 'instrument') {
        const baseValue = evaluateToken(prevToken, instrumentPrices);
        const result = baseValue * percentValue;
        
        // Replace the value and percentage with the result
        tokensWithPercentages.splice(i - 1, 2, {
          id: 'result-' + Math.random().toString(36).substring(2, 9),
          type: 'fixedValue',
          value: result.toString()
        });
        
        // Adjust index since we removed a token
        i--;
      }
    }
  }
  
  // Handle multiplication and division
  const tokensWithMultDiv = [...tokensWithPercentages];
  for (let i = 1; i < tokensWithMultDiv.length - 1; i++) {
    if (tokensWithMultDiv[i].type === 'operator' && 
        (tokensWithMultDiv[i].value === '*' || tokensWithMultDiv[i].value === '/')) {
      
      const left = evaluateToken(tokensWithMultDiv[i - 1], instrumentPrices);
      const right = evaluateToken(tokensWithMultDiv[i + 1], instrumentPrices);
      let result;
      
      if (tokensWithMultDiv[i].value === '*') {
        result = left * right;
      } else {
        // Division (handle divide by zero)
        if (right === 0) {
          console.error('Division by zero in formula');
          result = 0;
        } else {
          result = left / right;
        }
      }
      
      // Replace the operation and operands with the result
      tokensWithMultDiv.splice(i - 1, 3, {
        id: 'result-' + Math.random().toString(36).substring(2, 9),
        type: 'fixedValue',
        value: result.toString()
      });
      
      // Adjust index since we removed tokens
      i -= 1;
    }
  }
  
  // Handle addition and subtraction (left to right)
  let result = 0;
  let currentOp = '+';
  
  for (let i = 0; i < tokensWithMultDiv.length; i++) {
    const token = tokensWithMultDiv[i];
    
    if (token.type === 'operator') {
      currentOp = token.value;
    } else {
      const value = evaluateToken(token, instrumentPrices);
      
      if (currentOp === '+') {
        result += value;
      } else if (currentOp === '-') {
        result -= value;
      }
    }
  }
  
  return result;
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
  
  // Validate the formula before evaluation
  const validation = validateFormula(formula.tokens);
  if (!validation.valid) {
    console.error('Invalid formula:', validation.message);
    return 0;
  }
  
  return evaluateExpression(formula.tokens, instrumentPrices);
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
): Record<Instrument, { physical: number; pricing: number }> => {
  const exposure: Record<Instrument, { physical: number; pricing: number }> = {
    'Argus UCOME': { physical: 0, pricing: 0 },
    'Argus RME': { physical: 0, pricing: 0 },
    'Argus FAME0': { physical: 0, pricing: 0 },
    'Platts LSGO': { physical: 0, pricing: 0 },
    'Platts diesel': { physical: 0, pricing: 0 },
  };
  
  if (!formula || !formula.tokens) return exposure;
  
  // Direction multiplier: buy = -1 (we are exposed to price increases)
  // sell = 1 (we are exposed to price decreases)
  const directionMultiplier = buySell.toLowerCase() === 'buy' ? -1 : 1;
  
  // Identify the main physical instrument (typically the first one in the formula)
  let mainInstrument: Instrument | null = null;
  for (const token of formula.tokens) {
    if (token.type === 'instrument') {
      mainInstrument = token.value as Instrument;
      break;
    }
  }
  
  // Set physical exposure for the main instrument
  if (mainInstrument) {
    exposure[mainInstrument].physical = quantity * directionMultiplier;
  }
  
  // For pricing exposure, count all instruments in the formula
  formula.tokens.forEach(token => {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      // Simple exposure calculation: quantity * direction (opposite of physical)
      exposure[instrument].pricing = -quantity * directionMultiplier;
    }
  });
  
  return exposure;
};
