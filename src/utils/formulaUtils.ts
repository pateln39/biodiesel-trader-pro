
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

// Create a new percentage token
export const createPercentageToken = (value: number): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'percentage',
    value: value.toString(),
  };
};

// Create open bracket token
export const createOpenBracketToken = (): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'openBracket',
    value: '(',
  };
};

// Create close bracket token
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
    exposures: {
      'Argus UCOME': { physical: 0, pricing: 0 },
      'Argus RME': { physical: 0, pricing: 0 },
      'Argus FAME0': { physical: 0, pricing: 0 },
      'Platts LSGO': { physical: 0, pricing: 0 },
      'Platts diesel': { physical: 0, pricing: 0 },
    },
  };
};

// Convert formula to string representation
export const formulaToString = (tokens: FormulaToken[]): string => {
  let formula = '';
  
  tokens.forEach((token, index) => {
    // Handle special formatting based on token type
    if (token.type === 'percentage') {
      // Add percentage sign after the value
      formula += token.value + '%';
    } else if (token.type === 'operator' && tokens[index - 1]?.type === 'percentage') {
      // Add a space between percentage and operator
      formula += ' ' + token.value + ' ';
    } else if (token.type === 'operator') {
      // Add spaces around operators
      formula += ' ' + token.value + ' ';
    } else {
      formula += token.value;
    }
  });
  
  return formula;
};

// Validate formula structure
export const validateFormula = (tokens: FormulaToken[]): { valid: boolean; message?: string } => {
  // Check for balanced brackets
  let bracketCount = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'openBracket') {
      bracketCount++;
    } else if (token.type === 'closeBracket') {
      bracketCount--;
      if (bracketCount < 0) {
        return { valid: false, message: 'Unbalanced brackets: too many closing brackets' };
      }
    }
    
    // Check for consecutive operators
    if (token.type === 'operator' && i > 0 && tokens[i - 1].type === 'operator') {
      return { valid: false, message: 'Cannot have consecutive operators' };
    }
    
    // Check that percentage only follows a number or instrument
    if (token.type === 'percentage' && 
        i > 0 && 
        tokens[i - 1].type !== 'fixedValue' && 
        tokens[i - 1].type !== 'instrument' &&
        tokens[i - 1].type !== 'closeBracket') {
      return { valid: false, message: 'Percentage can only be applied to numbers, instruments, or expressions in brackets' };
    }
  }
  
  if (bracketCount > 0) {
    return { valid: false, message: 'Unbalanced brackets: missing closing brackets' };
  }
  
  // Check if formula ends with an operator
  if (tokens.length > 0 && tokens[tokens.length - 1].type === 'operator') {
    return { valid: false, message: 'Formula cannot end with an operator' };
  }
  
  return { valid: true };
};

// Calculate exposures for a formula
export const calculateExposures = (
  tokens: FormulaToken[],
  tradeQuantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): Record<Instrument, { physical: number; pricing: number }> => {
  const exposures: Record<Instrument, { physical: number; pricing: number }> = {
    'Argus UCOME': { physical: 0, pricing: 0 },
    'Argus RME': { physical: 0, pricing: 0 },
    'Argus FAME0': { physical: 0, pricing: 0 },
    'Platts LSGO': { physical: 0, pricing: 0 },
    'Platts diesel': { physical: 0, pricing: 0 },
  };

  // Direction factor: -1 for buy (we are exposed to price increases)
  // 1 for sell (we are exposed to price decreases)
  const directionFactor = buySell.toLowerCase() === 'buy' ? -1 : 1;
  
  // Physical exposure is simply the trade quantity in the direction of the trade
  const physicalQuantity = tradeQuantity * directionFactor;
  
  // We'll assume the first instrument in the formula is the physical product
  let mainInstrument: Instrument | null = null;
  
  // Identify the main instrument (usually the first one)
  for (const token of tokens) {
    if (token.type === 'instrument') {
      mainInstrument = token.value as Instrument;
      break;
    }
  }
  
  // Set physical exposure for the main instrument
  if (mainInstrument) {
    exposures[mainInstrument].physical = physicalQuantity;
  }
  
  // Calculate pricing exposures - more complex formulas would need a proper evaluation
  for (const token of tokens) {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      // For basic formulas, pricing exposure is opposite of physical
      exposures[instrument].pricing = -physicalQuantity;
    }
  }
  
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
    if (component.adjustment) {
      tokens.push(createOperatorToken(component.adjustment >= 0 ? '+' : '-'));
      tokens.push(createFixedValueToken(Math.abs(component.adjustment)));
    }
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

  // Simple conversion for backward compatibility
  // This is a basic implementation that doesn't handle complex formulas
  const instruments = formula.tokens.filter(token => token.type === 'instrument');
  
  const components = instruments.map(token => ({
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
