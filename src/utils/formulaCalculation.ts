
import { FormulaToken, ExposureResult, Instrument, PricingFormula } from '@/types';

export const createEmptyExposureResult = (): ExposureResult => ({
  physical: {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  },
  pricing: {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  }
});

// Helper function to check if a token is an instrument
export const isInstrument = (token: FormulaToken): boolean => token.type === 'instrument';

// Helper function to check if a token is an operator
export const isOperator = (token: FormulaToken): boolean => token.type === 'operator';

// Helper function to check if a token is a fixed value
export const isFixedValue = (token: FormulaToken): boolean => token.type === 'fixedValue';

// Helper function to check if a token is a percentage
export const isPercentage = (token: FormulaToken): boolean => token.type === 'percentage';

// Helper function to check if a token is an open bracket
export const isOpenBracket = (token: FormulaToken): boolean => token.type === 'openBracket';

// Helper function to check if a token is a close bracket
export const isCloseBracket = (token: FormulaToken): boolean => token.type === 'closeBracket';

// Enhanced function to determine if we can add a token type at the current position
export const canAddTokenType = (tokens: FormulaToken[], type: FormulaToken['type']): boolean => {
  if (tokens.length === 0) {
    // First token can be instrument, fixed value, or open bracket
    return ['instrument', 'fixedValue', 'openBracket'].includes(type);
  }

  const lastToken = tokens[tokens.length - 1];
  
  switch (type) {
    case 'instrument':
      // Can add instrument after operator or open bracket
      return isOperator(lastToken) || isOpenBracket(lastToken);
    
    case 'fixedValue':
      // Can add fixed value after operator or open bracket
      return isOperator(lastToken) || isOpenBracket(lastToken);
    
    case 'operator':
      // Can add operator after instrument, fixed value, percentage, or close bracket
      return isInstrument(lastToken) || isFixedValue(lastToken) || isPercentage(lastToken) || isCloseBracket(lastToken);
    
    case 'percentage':
      // Can add percentage after instrument, fixed value, or close bracket
      return isInstrument(lastToken) || isFixedValue(lastToken) || isCloseBracket(lastToken);
    
    case 'openBracket':
      // Can add open bracket after operator or another open bracket
      return isOperator(lastToken) || isOpenBracket(lastToken);
    
    case 'closeBracket': {
      // Can add close bracket after instrument, fixed value, percentage, or another close bracket
      // Also need to check that there's at least one unclosed open bracket
      if (!(isInstrument(lastToken) || isFixedValue(lastToken) || isPercentage(lastToken) || isCloseBracket(lastToken))) {
        return false;
      }
      
      // Count open and close brackets to ensure we don't have too many close brackets
      let openCount = 0;
      let closeCount = 0;
      
      for (const token of tokens) {
        if (isOpenBracket(token)) openCount++;
        if (isCloseBracket(token)) closeCount++;
      }
      
      return openCount > closeCount;
    }
    
    default:
      return false;
  }
};

// Calculate exposures for a formula with implicit multiplication handling
export const calculateExposures = (
  tokens: FormulaToken[],
  tradeQuantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): ExposureResult => {
  const result = createEmptyExposureResult();
  
  if (!tokens.length || tradeQuantity === 0) {
    return result;
  }
  
  // Find all instruments in the formula
  const instrumentTokens = tokens.filter(token => token.type === 'instrument');
  
  if (instrumentTokens.length === 0) {
    return result;
  }
  
  // For physical exposure, we'll use the first instrument in the formula
  const primaryInstrument = instrumentTokens[0].value as Instrument;
  const sign = buySell === 'buy' ? -1 : 1;
  
  // Set physical exposure for the primary instrument
  result.physical[primaryInstrument] = sign * tradeQuantity;
  
  // For pricing exposure, include all instruments in the formula
  instrumentTokens.forEach(token => {
    const pricingInstrument = token.value as Instrument;
    // Use opposite sign for pricing exposure
    result.pricing[pricingInstrument] = -sign * tradeQuantity;
  });
  
  return result;
};

// Convert formula to readable string
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};
