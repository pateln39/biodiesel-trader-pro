
import { v4 as uuidv4 } from 'uuid';
import { FormulaToken, PricingFormula } from '@/modules/trade/types/pricing';
import { TokenType } from '@/modules/trade/types/common';

/**
 * Create a new empty formula structure
 */
export const createEmptyFormula = (): PricingFormula => {
  return {
    tokens: [],
    exposures: { physical: {}, pricing: {} }
  };
};

/**
 * Create a new instrument token
 */
export const createInstrumentToken = (instrument: string): FormulaToken => {
  return {
    id: uuidv4(),
    type: 'instrument',
    value: instrument
  };
};

/**
 * Create a new operator token
 */
export const createOperatorToken = (operator: string): FormulaToken => {
  return {
    id: uuidv4(),
    type: 'operator',
    value: operator
  };
};

/**
 * Create a new fixed value token
 */
export const createFixedValueToken = (value: number): FormulaToken => {
  return {
    id: uuidv4(),
    type: 'fixedValue',
    value: value.toString()
  };
};

/**
 * Create a new percentage token
 */
export const createPercentageToken = (value: number): FormulaToken => {
  return {
    id: uuidv4(),
    type: 'percentage',
    value: value.toString()
  };
};

/**
 * Create an open bracket token
 */
export const createOpenBracketToken = (): FormulaToken => {
  return {
    id: uuidv4(),
    type: 'openBracket',
    value: '('
  };
};

/**
 * Create a close bracket token
 */
export const createCloseBracketToken = (): FormulaToken => {
  return {
    id: uuidv4(),
    type: 'closeBracket',
    value: ')'
  };
};

/**
 * Validate and parse a pricing formula from any source
 */
export const validateAndParsePricingFormula = (formula: any): PricingFormula => {
  if (!formula) {
    return createEmptyFormula();
  }
  
  try {
    // If it's a string, try to parse it
    if (typeof formula === 'string') {
      formula = JSON.parse(formula);
    }
    
    // Check if it has tokens property
    if (formula.tokens && Array.isArray(formula.tokens)) {
      return {
        tokens: formula.tokens,
        exposures: formula.exposures || { physical: {}, pricing: {} }
      };
    }
    
    // If it's not properly structured, return empty formula
    return createEmptyFormula();
  } catch (e) {
    console.error('Error parsing formula:', e);
    return createEmptyFormula();
  }
};

/**
 * Convert formula tokens to a display string
 */
export const formulaToDisplayString = (tokens: FormulaToken[]): string => {
  if (!tokens || !tokens.length) return '';
  
  return tokens.map(token => {
    switch (token.type) {
      case 'instrument':
        return token.value;
      case 'operator':
        return ` ${token.value} `;
      case 'fixedValue':
        return token.value;
      case 'percentage':
        return `${token.value}%`;
      case 'openBracket':
        return '(';
      case 'closeBracket':
        return ')';
      default:
        return token.value;
    }
  }).join('');
};

/**
 * Convert formula tokens to a basic string representation
 */
export const formulaToString = (tokens: FormulaToken[]): string => {
  if (!tokens || !tokens.length) return '';
  return tokens.map(t => t.value).join(' ');
};
