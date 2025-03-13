
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

// Convert formula to string representation
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};

// Convert from formula format to pricingComponents format (for backward compatibility)
export const convertToTraditionalFormat = (formula: PricingFormula): any[] => {
  if (!formula || !formula.tokens.length) {
    return [{
      instrument: 'Argus UCOME',
      percentage: 100,
      adjustment: 0
    }];
  }

  const components = formula.tokens
    .filter(token => token.type === 'instrument')
    .map(token => ({
      instrument: token.value,
      percentage: 100,
      adjustment: 0
    }));

  return components.length ? components : [{
    instrument: 'Argus UCOME',
    percentage: 100,
    adjustment: 0
  }];
};

// Helper to convert between old pricingFormula format and new formula format
export const convertToNewFormulaFormat = (pricingComponents: any[]): PricingFormula => {
  if (!pricingComponents || pricingComponents.length === 0) {
    return createEmptyFormula();
  }

  const tokens: FormulaToken[] = [];
  pricingComponents.forEach((component, index) => {
    tokens.push(createInstrumentToken(component.instrument));
    if (index < pricingComponents.length - 1) {
      tokens.push(createOperatorToken('+'));
    }
  });

  return {
    tokens,
    exposures: createEmptyExposureResult(), // Default exposures
  };
};
