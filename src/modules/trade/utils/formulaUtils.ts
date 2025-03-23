
import { PricingFormula, FormulaToken } from '@/modules/trade/types/pricing';
import { v4 as uuidv4 } from 'uuid';

// Create an empty formula structure
export function createEmptyFormula(): PricingFormula {
  return {
    tokens: [],
    exposures: {
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
    }
  };
}

// Create an instrument token
export function createInstrumentToken(instrument: string): FormulaToken {
  return {
    id: uuidv4(),
    type: 'instrument',
    value: instrument
  };
}

// Create a fixed value token
export function createFixedValueToken(value: number): FormulaToken {
  return {
    id: uuidv4(),
    type: 'fixedValue',
    value: value.toString()
  };
}

// Create a percentage token
export function createPercentageToken(value: number): FormulaToken {
  return {
    id: uuidv4(),
    type: 'percentage',
    value: value.toString()
  };
}

// Create an operator token
export function createOperatorToken(operator: string): FormulaToken {
  return {
    id: uuidv4(),
    type: 'operator',
    value: operator
  };
}

// Create open bracket token
export function createOpenBracketToken(): FormulaToken {
  return {
    id: uuidv4(),
    type: 'openBracket',
    value: '('
  };
}

// Create close bracket token
export function createCloseBracketToken(): FormulaToken {
  return {
    id: uuidv4(),
    type: 'closeBracket',
    value: ')'
  };
}

// Convert formula to string representation
export function formulaToString(formula: PricingFormula | undefined): string {
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return '';
  }

  return formula.tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
}

// Parse and validate a pricing formula from stored format
export function validateAndParsePricingFormula(formulaData: any): PricingFormula {
  if (!formulaData) {
    return createEmptyFormula();
  }

  try {
    // Handle case where formula is stored as a JSON string
    const parsedFormula = typeof formulaData === 'string' ? JSON.parse(formulaData) : formulaData;
    
    // Basic validation of formula structure
    if (!parsedFormula.tokens) {
      return createEmptyFormula();
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
    return createEmptyFormula();
  }
}
