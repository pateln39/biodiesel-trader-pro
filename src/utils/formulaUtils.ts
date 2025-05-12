
import { FormulaToken, PricingFormula } from '@/types/pricing';
import { Instrument } from '@/types/common';
import { 
  createEmptyExposureResult, 
  calculateExposures 
} from './formulaCalculation';

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

// Validate and parse a potential pricing formula from the database
export const validateAndParsePricingFormula = (rawFormula: any): PricingFormula => {
  // If null or undefined, return empty formula
  if (!rawFormula) {
    return createEmptyFormula();
  }
  
  // Check if the raw formula has tokens
  if (!rawFormula.tokens || !Array.isArray(rawFormula.tokens)) {
    console.warn('Invalid formula structure: missing or invalid tokens array');
    return createEmptyFormula();
  }
  
  // Check if all tokens have the required properties
  const validTokens = rawFormula.tokens.every((token: any) => 
    token && 
    typeof token.id === 'string' && 
    typeof token.type === 'string' && 
    typeof token.value === 'string'
  );
  
  if (!validTokens) {
    console.warn('Invalid formula structure: some tokens have invalid properties');
    return createEmptyFormula();
  }
  
  // Now we can safely cast to partial formula
  const partialFormula = {
    tokens: rawFormula.tokens,
    exposures: rawFormula.exposures,
    monthlyDistribution: rawFormula.monthlyDistribution // Preserve monthly distribution
  };
  
  // Use ensureCompleteExposures to fill in any missing exposure data
  return ensureCompleteExposures(partialFormula);
};

// Ensure pricing formula has complete exposure structure
export const ensureCompleteExposures = (formula: any): PricingFormula => {
  if (!formula) {
    return createEmptyFormula();
  }
  
  // Create a complete default exposure structure
  const defaultExposures = createEmptyExposureResult();
  
  // If formula has no exposures property or it's incomplete, merge with defaults
  if (!formula.exposures) {
    return {
      ...formula,
      exposures: defaultExposures
    };
  }
  
  // Merge physical exposures, preserving existing values
  const mergedPhysical: Record<Instrument, number> = {
    ...defaultExposures.physical,
    ...(formula.exposures.physical || {})
  };
  
  // Merge pricing exposures, preserving existing values
  const mergedPricing: Record<Instrument, number> = {
    ...defaultExposures.pricing,
    ...(formula.exposures.pricing || {})
  };
  
  return {
    ...formula, // This preserves any additional properties like monthlyDistribution
    exposures: {
      physical: mergedPhysical,
      pricing: mergedPricing
    }
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
