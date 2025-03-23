
import { FormulaToken, TokenType } from '@/modules/trade/types/pricing';

/**
 * Calculate exposures from formula tokens
 */
export const calculateExposures = (
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell',
  selectedProduct?: string
) => {
  if (!tokens || tokens.length === 0 || quantity === 0) {
    return createEmptyExposureResult();
  }

  const physical = calculatePhysicalExposure(tokens, quantity, buySell);
  const pricing = calculatePricingExposure(tokens, quantity, buySell);

  return {
    physical,
    pricing
  };
};

/**
 * Calculate physical exposures from formula tokens
 */
export const calculatePhysicalExposure = (
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell'
): Record<string, number> => {
  if (!tokens || tokens.length === 0 || quantity === 0) {
    return {};
  }

  const result: Record<string, number> = {};
  const sign = buySell === 'buy' ? 1 : -1;

  // Physical exposure only applies to instruments
  tokens.forEach(token => {
    if (token.type === 'instrument') {
      result[token.value] = (result[token.value] || 0) + sign * quantity;
    }
  });

  return result;
};

/**
 * Calculate pricing exposures from formula tokens
 */
export const calculatePricingExposure = (
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell'
): Record<string, number> => {
  if (!tokens || tokens.length === 0 || quantity === 0) {
    return {};
  }

  const result: Record<string, number> = {};
  const sign = buySell === 'buy' ? -1 : 1; // Opposite sign for pricing exposure

  // Analyze the formula to determine pricing exposure
  tokens.forEach(token => {
    if (token.type === 'instrument') {
      result[token.value] = (result[token.value] || 0) + sign * quantity;
    }
  });

  return result;
};

/**
 * Create an empty exposure result object
 */
export const createEmptyExposureResult = () => {
  return {
    physical: {},
    pricing: {}
  };
};

/**
 * Check if a token type can be added to the formula
 */
export const canAddTokenType = (tokens: FormulaToken[], type: string): boolean => {
  if (tokens.length === 0) {
    // First token can only be an instrument, a fixed value, or an open bracket
    return ['instrument', 'fixedValue', 'openBracket'].includes(type);
  }

  const lastToken = tokens[tokens.length - 1];

  switch (lastToken.type) {
    case 'instrument':
    case 'fixedValue':
    case 'percentage':
    case 'closeBracket':
      // After a value/instrument/percentage/close bracket, only operators are allowed
      return type === 'operator';
    case 'operator':
      // After an operator, only instruments, fixed values, percentages, or open brackets are allowed
      return ['instrument', 'fixedValue', 'percentage', 'openBracket'].includes(type);
    case 'openBracket':
      // After an open bracket, only instruments, fixed values, percentages, or another open bracket are allowed
      return ['instrument', 'fixedValue', 'percentage', 'openBracket'].includes(type);
    default:
      return false;
  }
};

/**
 * Check if a token is an instrument
 */
export const isInstrument = (token: FormulaToken): boolean => {
  return token.type === 'instrument';
};

/**
 * Check if a token is an operator
 */
export const isOperator = (token: FormulaToken): boolean => {
  return token.type === 'operator';
};

/**
 * Check if a token is a fixed value
 */
export const isFixedValue = (token: FormulaToken): boolean => {
  return token.type === 'fixedValue';
};

/**
 * Check if a token is a percentage
 */
export const isPercentage = (token: FormulaToken): boolean => {
  return token.type === 'percentage';
};

/**
 * Check if a token is an open bracket
 */
export const isOpenBracket = (token: FormulaToken): boolean => {
  return token.type === 'openBracket';
};

/**
 * Check if a token is a close bracket
 */
export const isCloseBracket = (token: FormulaToken): boolean => {
  return token.type === 'closeBracket';
};

/**
 * Check if a token is a value (instrument, fixed value, or percentage)
 */
export const isValue = (token: FormulaToken): boolean => {
  return isInstrument(token) || isFixedValue(token) || isPercentage(token);
};
