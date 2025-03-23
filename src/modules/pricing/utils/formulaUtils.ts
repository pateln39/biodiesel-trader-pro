
import { TokenType } from '@/core/types/common';

/**
 * Create an empty formula structure
 * @returns Empty pricing formula object with default values
 */
export function createEmptyFormula() {
  return {
    tokens: [],
    exposures: {
      physical: {},
      pricing: {}
    }
  };
}

/**
 * Convert a formula object to a readable string 
 * @param tokens Array of formula tokens
 * @returns Formatted string representation of the formula
 */
export function formulaToString(tokens: any[] = []): string {
  if (!tokens || tokens.length === 0) {
    return '';
  }

  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
}

/**
 * Format formula for display purposes with special formatting
 * @param formula Formula object or tokens array
 * @returns Formatted string for display
 */
export function formulaToDisplayString(formula: any): string {
  const tokens = formula?.tokens || formula || [];
  return formulaToString(tokens);
}

/**
 * Validate and parse a pricing formula from a stored format
 * @param formulaData Raw formula data from database
 * @returns Properly formatted formula object
 */
export function validateAndParsePricingFormula(formulaData: any): any {
  if (!formulaData) {
    return null;
  }

  try {
    // Handle case where formula is stored as a JSON string
    const parsedFormula = typeof formulaData === 'string' ? JSON.parse(formulaData) : formulaData;
    
    // Basic validation of formula structure
    if (!parsedFormula.tokens) {
      return null;
    }
    
    // Ensure all required fields exist
    return {
      tokens: parsedFormula.tokens || [],
      exposures: parsedFormula.exposures || {
        physical: {},
        pricing: {}
      }
    };
  } catch (error) {
    console.error('Error parsing formula:', error);
    return null;
  }
}

/**
 * Create an instrument token
 */
export function createInstrumentToken(instrument: string) {
  return {
    id: crypto.randomUUID(),
    type: 'instrument',
    value: instrument
  };
}

/**
 * Create a fixed value token
 */
export function createFixedValueToken(value: number) {
  return {
    id: crypto.randomUUID(),
    type: 'fixedValue',
    value: value.toString()
  };
}

/**
 * Create a percentage token
 */
export function createPercentageToken(value: number) {
  return {
    id: crypto.randomUUID(),
    type: 'percentage',
    value: value.toString()
  };
}

/**
 * Create an operator token
 */
export function createOperatorToken(operator: string) {
  return {
    id: crypto.randomUUID(),
    type: 'operator',
    value: operator
  };
}

/**
 * Create open bracket token
 */
export function createOpenBracketToken() {
  return {
    id: crypto.randomUUID(),
    type: 'openBracket',
    value: '('
  };
}

/**
 * Create close bracket token
 */
export function createCloseBracketToken() {
  return {
    id: crypto.randomUUID(),
    type: 'closeBracket',
    value: ')'
  };
}
