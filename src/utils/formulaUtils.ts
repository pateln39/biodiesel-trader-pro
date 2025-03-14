
import { FormulaToken, Instrument, PricingFormula, ExposureResult } from '@/types';
import { createEmptyExposureResult, calculateExposures } from './formulaCalculation';

// Generate a unique ID for formula tokens
export const generateNodeId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Create a new instrument token
export const createInstrumentToken = (instrument: Instrument): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'instrument',
    value: instrument,
  };
};

// Create a new fixed value token
export const createFixedValueToken = (value: number): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'fixedValue',
    value: value.toString(),
  };
};

// Create a new percentage token
export const createPercentageToken = (value: number): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'percentage',
    value: value.toString(),
  };
};

// Create a new operator token
export const createOperatorToken = (operator: string): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'operator',
    value: operator,
  };
};

// Create a new open bracket token
export const createOpenBracketToken = (): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'openBracket',
    value: '(',
  };
};

// Create a new close bracket token
export const createCloseBracketToken = (): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'closeBracket',
    value: ')',
  };
};

// Create a new empty formula
export const createEmptyFormula = (): PricingFormula => {
  return {
    tokens: [],
    exposures: createEmptyExposureResult(),
  };
};

// Convert formula to string representation with proper spacing
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};

// Enhanced formula display with better formatting for UI
export const formulaToDisplayString = (tokens: FormulaToken[]): string => {
  if (!tokens || tokens.length === 0) {
    return 'No formula';
  }
  
  // Format the tokens with better spacing and symbols
  return tokens.map((token, index) => {
    switch (token.type) {
      case 'instrument':
        // Show full instrument name with prefix (removed the prefix stripping code)
        return token.value;
      case 'percentage':
        // Percentages are formatted with a % sign
        return `${token.value}%`;
      case 'fixedValue':
        // Fixed values are formatted as numbers
        return Number(token.value).toLocaleString('en-US', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        });
      case 'operator':
        // Operators are formatted with spaces for better readability
        return ` ${token.value} `;
      case 'openBracket':
        // Open brackets are formatted with spaces after
        return '( ';
      case 'closeBracket':
        // Close brackets are formatted with spaces before
        return ' )';
      default:
        return token.value;
    }
  }).join('').replace(/\s{2,}/g, ' ').trim();
};
