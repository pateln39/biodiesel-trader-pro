
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

// Helper function to determine if we can add a token type at the current position
export const canAddTokenType = (tokens: FormulaToken[], type: FormulaToken['type']): boolean => {
  if (tokens.length === 0) {
    // First token can be instrument, fixed value, percentage, or open bracket
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
      return isOperator(lastToken) || isOpenBracket(lastToken) || tokens.length === 0;
    case 'closeBracket':
      // Can add close bracket after instrument, fixed value, percentage, or another close bracket
      return isInstrument(lastToken) || isFixedValue(lastToken) || isPercentage(lastToken) || isCloseBracket(lastToken);
    default:
      return false;
  }
};

// Calculate exposures for a formula
export const calculateExposures = (
  tokens: FormulaToken[],
  tradeQuantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): ExposureResult => {
  const result = createEmptyExposureResult();
  
  // For now, implement a simplified calculation
  // We'll assume a single instrument for physical exposure
  // In a real implementation, you would need to parse the full formula
  
  // Find the primary instrument (first one in the formula)
  const primaryInstrument = tokens.find(token => token.type === 'instrument');
  
  if (primaryInstrument) {
    const instrument = primaryInstrument.value as Instrument;
    const sign = buySell === 'buy' ? -1 : 1;
    
    // Set physical exposure for the primary instrument
    result.physical[instrument] = sign * tradeQuantity;
    
    // For pricing exposure, include all instruments in the formula
    tokens.forEach(token => {
      if (token.type === 'instrument') {
        const pricingInstrument = token.value as Instrument;
        // Use opposite sign for pricing exposure
        result.pricing[pricingInstrument] = -sign * tradeQuantity;
      }
    });
  }
  
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
