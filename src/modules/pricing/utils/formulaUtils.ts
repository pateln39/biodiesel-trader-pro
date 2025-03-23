
import { TokenType } from '@/core/types/common';

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
