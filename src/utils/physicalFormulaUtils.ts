
import { PhysicalFormulaToken, PhysicalFormulaConfig, PhysicalExposureResult, PartialPhysicalExposureResult } from '@/types/physicalFormula';
import { Instrument } from '@/types/common';

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

// Create a new token for a physical formula
export const createPhysicalToken = (type: "number" | "operator" | "variable" | "function", value: string | number): PhysicalFormulaToken => {
  return {
    type,
    value
  };
};

// Create a number token
export const createNumberToken = (value: number): PhysicalFormulaToken => {
  return createPhysicalToken("number", value);
};

// Create an operator token
export const createOperatorToken = (value: string): PhysicalFormulaToken => {
  return createPhysicalToken("operator", value);
};

// Create a variable token
export const createVariableToken = (value: string): PhysicalFormulaToken => {
  return createPhysicalToken("variable", value);
};

// Create a function token
export const createFunctionToken = (value: string): PhysicalFormulaToken => {
  return createPhysicalToken("function", value);
};

// Create an empty physical exposure result
export const createEmptyPhysicalExposureResult = (): PhysicalExposureResult => {
  return {
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
  };
};

// Ensure physical formula has complete exposure structure
export const ensureCompletePhysicalExposures = (formula: PartialPhysicalExposureResult | undefined): PhysicalExposureResult => {
  if (!formula) {
    return createEmptyPhysicalExposureResult();
  }
  
  // Create a complete default exposure structure
  const defaultExposures = createEmptyPhysicalExposureResult();
  
  // If formula has no exposures property or it's incomplete, merge with defaults
  if (!formula.physical || !formula.pricing) {
    return defaultExposures;
  }
  
  // Merge physical exposures, preserving existing values
  const mergedPhysical: Record<Instrument, number> = {
    ...defaultExposures.physical,
    ...(formula.physical || {})
  };
  
  // Merge pricing exposures, preserving existing values
  const mergedPricing: Record<Instrument, number> = {
    ...defaultExposures.pricing,
    ...(formula.pricing || {})
  };
  
  return {
    physical: mergedPhysical,
    pricing: mergedPricing
  };
};
