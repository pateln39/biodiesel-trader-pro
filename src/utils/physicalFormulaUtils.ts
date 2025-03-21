
import { PhysicalFormulaToken, PhysicalFormulaConfig } from '@/types/physicalFormula';

// Create a new empty physical formula config
export const createEmptyPhysicalFormula = (): PhysicalFormulaConfig => {
  return {
    tokens: []
  };
};

// Validate and parse a potential physical formula from the database
export const validateAndParsePhysicalFormula = (rawFormula: any): PhysicalFormulaConfig => {
  // If null or undefined, return empty formula
  if (!rawFormula) {
    return createEmptyPhysicalFormula();
  }
  
  // Check if the raw formula has tokens
  if (!rawFormula.tokens || !Array.isArray(rawFormula.tokens)) {
    console.warn('Invalid physical formula structure: missing or invalid tokens array');
    return createEmptyPhysicalFormula();
  }
  
  return {
    tokens: rawFormula.tokens
  };
};

// Convert physical formula to string representation
export const physicalFormulaToString = (formula: PhysicalFormulaConfig): string => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return 'No formula';
  }
  
  return formula.tokens
    .map(token => token.value.toString())
    .join(' ');
};
