
import { FormulaToken, Instrument, PricingFormula } from '@/types';

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

// Create a new operator token
export const createOperatorToken = (operator: string): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'operator',
    value: operator,
  };
};

// Create a new empty formula
export const createEmptyFormula = (): PricingFormula => {
  return {
    tokens: [],
    exposures: {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Platts LSGO': 0,
      'Platts diesel': 0,
    },
  };
};

// Convert formula to string representation
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => token.value).join(' ');
};

// Calculate exposures for a formula
export const calculateExposures = (
  tokens: FormulaToken[],
  tradeQuantity: number
): Record<Instrument, number> => {
  const exposures: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };

  // Simple implementation - counts instruments and applies trade quantity
  tokens.forEach(token => {
    if (token.type === 'instrument') {
      exposures[token.value as Instrument] = -tradeQuantity;
    }
  });

  return exposures;
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
    exposures: calculateExposures(tokens, 1), // Default quantity of 1
  };
};

// Convert from formula format to pricingComponents format
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
