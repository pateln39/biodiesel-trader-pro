import { FormulaToken } from '@/types/pricing';
import { Instrument, ExposureResult, OperatorType } from '@/types/common';
import { formatMonthCode, getBusinessDaysByMonth, distributeValueByBusinessDays } from '@/utils/dateUtils';
import { calculateDailyExposureRate } from '@/utils/exposureUtils';

export function tokenizeFormula(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let currentNumber = '';

  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];

    if (/\d|\./.test(char)) {
      currentNumber += char;
    } else if (char === '+' || char === '-' || char === '*' || char === '/') {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
      tokens.push({ type: 'operator', value: char as OperatorType });
    } else if (char === '(' || char === ')') {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
      tokens.push({ type: 'parenthesis', value: char });
    } else if (char === ' ') {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
    } else {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
      tokens.push({ type: 'variable', value: char });
    }
  }

  if (currentNumber !== '') {
    tokens.push({ type: 'number', value: parseFloat(currentNumber) });
  }

  return tokens;
}

export function evaluateFormula(formula: FormulaToken[]): number {
  const getValueAsString = (value: string | number): string => {
    return String(value);
  };

  function processNumericToken(token: FormulaToken): number {
    if (typeof token.value === 'number') {
      return token.value;
    } else if (typeof token.value === 'string') {
      const parsedValue = parseFloat(token.value);
      if (!isNaN(parsedValue)) {
        return parsedValue;
      } else {
        console.error(`Invalid number value: ${token.value}`);
        return 0;
      }
    }
    return Number(token.value);
  }

  let result = 0;
  let currentOperator: OperatorType | null = null;

  for (const token of formula) {
    if (token.type === 'number') {
      const numberValue = processNumericToken(token);

      if (currentOperator === null) {
        result = numberValue;
      } else {
        switch (currentOperator) {
          case '+':
            result += numberValue;
            break;
          case '-':
            result -= numberValue;
            break;
          case '*':
            result *= numberValue;
            break;
          case '/':
            if (numberValue === 0) {
              console.error('Division by zero!');
              return NaN;
            }
            result /= numberValue;
            break;
          default:
            console.error(`Unknown operator: ${currentOperator}`);
            return NaN;
        }
        currentOperator = null;
      }
    } else if (token.type === 'operator') {
      currentOperator = token.value as OperatorType;
    }
  }

  return result;
}

export function canAddTokenType(tokens: FormulaToken[], type: string): boolean {
  if (tokens.length === 0) {
    return ['instrument', 'fixedValue', 'percentage', 'openBracket'].includes(type);
  }

  const lastToken = tokens[tokens.length - 1];

  switch (type) {
    case 'instrument':
    case 'fixedValue':
    case 'percentage':
      return lastToken.type === 'operator' || lastToken.type === 'openBracket';
    
    case 'operator':
      return ['number', 'instrument', 'fixedValue', 'percentage', 'closeBracket'].includes(lastToken.type);
    
    case 'openBracket':
      return lastToken.type === 'operator' || lastToken.type === 'openBracket';
    
    case 'closeBracket':
      const openBracketCount = tokens.filter(t => t.type === 'openBracket').length;
      const closeBracketCount = tokens.filter(t => t.type === 'closeBracket').length;
      return ['number', 'instrument', 'fixedValue', 'percentage', 'closeBracket'].includes(lastToken.type)
        && openBracketCount > closeBracketCount;
    
    default:
      return false;
  }
}

export function createEmptyExposureResult(): ExposureResult {
  return {
    physical: {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Platts LSGO': 0,
      'Platts Diesel': 0,
      'Argus HVO': 0,
      'ICE GASOIL FUTURES': 0,
      'ICE GASOIL FUTURES (EFP)': 0
    },
    pricing: {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Platts LSGO': 0,
      'Platts Diesel': 0,
      'Argus HVO': 0,
      'ICE GASOIL FUTURES': 0,
      'ICE GASOIL FUTURES (EFP)': 0
    }
  };
}

export function calculateExposures(
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: 'buy' | 'sell',
  selectedProduct?: string
): ExposureResult {
  const physicalExposure = calculatePhysicalExposure(tokens, quantity, buySell, selectedProduct);
  const pricingExposure = calculatePricingExposure(tokens, quantity, buySell);
  
  return {
    physical: physicalExposure,
    pricing: pricingExposure
  };
}

export function calculatePhysicalExposure(
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: 'buy' | 'sell',
  selectedProduct?: string
): Record<Instrument, number> {
  const exposures = Object.fromEntries(
    Object.keys(createEmptyExposureResult().physical).map(key => [key, 0])
  ) as Record<Instrument, number>;
  
  const exposureDirection = buySell === 'buy' ? 1 : -1;
  
  if (tokens.length === 0 && selectedProduct) {
    switch (selectedProduct) {
      case 'UCOME':
      case 'UCOME-5':
        exposures['Argus UCOME'] = quantity * exposureDirection;
        break;
      case 'RME':
      case 'RME DC':
        exposures['Argus RME'] = quantity * exposureDirection;
        break;
      case 'FAME0':
        exposures['Argus FAME0'] = quantity * exposureDirection;
        break;
      case 'HVO':
        exposures['Argus HVO'] = quantity * exposureDirection;
        break;
      default:
        break;
    }
    return exposures;
  }
  
  for (const token of tokens) {
    if (token.type === 'instrument') {
      const instrumentName = String(token.value);
      if (instrumentName in exposures) {
        exposures[instrumentName as Instrument] = quantity * exposureDirection;
      }
    }
  }
  
  return exposures;
}

export function calculatePricingExposure(
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: 'buy' | 'sell'
): Record<Instrument, number> {
  const exposures = Object.fromEntries(
    Object.keys(createEmptyExposureResult().pricing).map(key => [key, 0])
  ) as Record<Instrument, number>;
  
  // If no tokens, return empty exposures
  if (tokens.length === 0) {
    return exposures;
  }
  
  const exposureDirection = buySell === 'buy' ? -1 : 1;
  const instrumentNodes = parseFormula(tokens);
  
  // Get all instruments referenced in the formula
  const instrumentCoefficients = calculateInstrumentCoefficients(instrumentNodes);
  
  // Apply coefficients to exposures
  Object.entries(instrumentCoefficients).forEach(([instrument, coefficient]) => {
    if (instrument in exposures) {
      exposures[instrument as Instrument] = quantity * exposureDirection * coefficient;
    }
  });
  
  return exposures;
}

// Calculate coefficients for each instrument based on the formula structure
function calculateInstrumentCoefficients(node: ParseNode): Record<string, number> {
  const coefficients: Record<string, number> = {};
  
  // Base cases
  if (node.type === 'instrument') {
    const instrument = String(node.value);
    coefficients[instrument] = 1;
    return coefficients;
  }
  
  if (node.type === 'value') {
    return coefficients; // No instruments in a value node
  }
  
  // Recursive cases
  if (node.type === 'binary' && node.left && node.right) {
    const leftCoefficients = calculateInstrumentCoefficients(node.left);
    const rightCoefficients = calculateInstrumentCoefficients(node.right);
    
    // Combine coefficients based on operator
    if (node.operator === '+') {
      // Addition: just combine the coefficients
      Object.entries(leftCoefficients).forEach(([instrument, coefficient]) => {
        coefficients[instrument] = (coefficients[instrument] || 0) + coefficient;
      });
      
      Object.entries(rightCoefficients).forEach(([instrument, coefficient]) => {
        coefficients[instrument] = (coefficients[instrument] || 0) + coefficient;
      });
    } 
    else if (node.operator === '-') {
      // Subtraction: add left coefficients, subtract right coefficients
      Object.entries(leftCoefficients).forEach(([instrument, coefficient]) => {
        coefficients[instrument] = (coefficients[instrument] || 0) + coefficient;
      });
      
      Object.entries(rightCoefficients).forEach(([instrument, coefficient]) => {
        coefficients[instrument] = (coefficients[instrument] || 0) - coefficient;
      });
    }
    else if (node.operator === '*') {
      // Multiplication - Different cases:
      
      // Case 1: Left is a value (e.g., 50% * RME)
      if (node.left.type === 'value' && node.left.value !== undefined) {
        const multiplier = Number(node.left.value);
        Object.entries(rightCoefficients).forEach(([instrument, coefficient]) => {
          coefficients[instrument] = (coefficients[instrument] || 0) + (multiplier * coefficient);
        });
      }
      // Case 2: Right is a value (e.g., RME * 50%)
      else if (node.right.type === 'value' && node.right.value !== undefined) {
        const multiplier = Number(node.right.value);
        Object.entries(leftCoefficients).forEach(([instrument, coefficient]) => {
          coefficients[instrument] = (coefficients[instrument] || 0) + (multiplier * coefficient);
        });
      }
      // Case 3: Both sides have instruments - more complex case, handled conservatively
      else {
        // For now, apply a simple approach for instrument * instrument
        Object.entries(leftCoefficients).forEach(([instrument, coefficient]) => {
          coefficients[instrument] = (coefficients[instrument] || 0) + coefficient;
        });
        
        Object.entries(rightCoefficients).forEach(([instrument, coefficient]) => {
          coefficients[instrument] = (coefficients[instrument] || 0) + coefficient;
        });
      }
    }
    else if (node.operator === '/') {
      // Division - Different cases:
      
      // Case 1: Right is a value (e.g., RME / 2)
      if (node.right.type === 'value' && node.right.value !== undefined) {
        const divisor = Number(node.right.value);
        if (divisor !== 0) {
          Object.entries(leftCoefficients).forEach(([instrument, coefficient]) => {
            coefficients[instrument] = (coefficients[instrument] || 0) + (coefficient / divisor);
          });
        }
      }
      // Case 2: Other cases - handled conservatively 
      else {
        Object.entries(leftCoefficients).forEach(([instrument, coefficient]) => {
          coefficients[instrument] = (coefficients[instrument] || 0) + coefficient;
        });
      }
    }
  }
  
  // Handle unary operations (like -RME)
  if (node.type === 'unary' && node.right) {
    const rightCoefficients = calculateInstrumentCoefficients(node.right);
    
    if (node.operator === '-') {
      Object.entries(rightCoefficients).forEach(([instrument, coefficient]) => {
        coefficients[instrument] = (coefficients[instrument] || 0) - coefficient;
      });
    } else {
      Object.entries(rightCoefficients).forEach(([instrument, coefficient]) => {
        coefficients[instrument] = (coefficients[instrument] || 0) + coefficient;
      });
    }
  }
  
  return coefficients;
}

export function calculateMonthlyPricingDistribution(
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell',
  startDate: Date,
  endDate: Date
): Record<string, Record<string, number>> {
  const distribution: Record<string, Record<string, number>> = {};
  const instrumentExposures: Record<string, number> = {};
  
  const exposures = calculatePricingExposure(tokens, quantity, buySell);
  
  Object.entries(exposures).forEach(([instrument, value]) => {
    if (value !== 0) {
      instrumentExposures[instrument] = value;
    }
  });
  
  if (Object.keys(instrumentExposures).length === 0) {
    return distribution;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const businessDaysByMonth = getBusinessDaysByMonth(start, end);
  
  Object.keys(instrumentExposures).forEach(instrument => {
    if (!distribution[instrument]) {
      distribution[instrument] = {};
    }
    
    const totalExposure = instrumentExposures[instrument];
    const monthlyValues = distributeValueByBusinessDays(totalExposure, businessDaysByMonth);
    
    Object.entries(monthlyValues).forEach(([monthCode, value]) => {
      distribution[instrument][monthCode] = value;
    });
  });
  
  return distribution;
}

/**
 * Calculate daily exposure rates for a formula
 */
export function calculateFormulaWithDailyRates(
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell',
  startDate: Date,
  endDate: Date
): {
  monthlyDistribution: Record<string, Record<string, number>>;
  dailyExposureRate: Record<string, number>;
} {
  const pricingExposure = calculatePricingExposure(tokens, quantity, buySell);
  const monthlyDistribution = calculateMonthlyPricingDistribution(
    tokens, quantity, buySell, startDate, endDate
  );
  
  const dailyExposureRate = calculateDailyExposureRate(
    pricingExposure,
    startDate,
    endDate
  );
  
  return {
    monthlyDistribution,
    dailyExposureRate
  };
}

interface ParseNode {
  type: string;
  value?: any;
  left?: ParseNode;
  right?: ParseNode;
  operator?: string;
}

export function parseFormula(tokens: FormulaToken[]): ParseNode {
  let position = 0;
  
  function parseExpression(): ParseNode {
    let left = parseTerm();
    
    while (position < tokens.length && 
           tokens[position].type === 'operator' && 
           (tokens[position].value === '+' || tokens[position].value === '-')) {
      const operator = String(tokens[position].value);
      position++;
      const right = parseTerm();
      left = {
        type: 'binary',
        operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  function parseTerm(): ParseNode {
    let left = parseFactor();
    
    while (position < tokens.length && 
           tokens[position].type === 'operator' && 
           (tokens[position].value === '*' || tokens[position].value === '/')) {
      const operator = String(tokens[position].value);
      position++;
      const right = parseFactor();
      left = {
        type: 'binary',
        operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  function parseFactor(): ParseNode {
    if (position < tokens.length && tokens[position].type === 'operator' && tokens[position].value === '-') {
      position++;
      const operand = parseFactor();
      return { type: 'unary', operator: '-', right: operand };
    }
    
    if (position < tokens.length && tokens[position].type === 'openBracket') {
      position++;
      const expr = parseExpression();
      if (position < tokens.length && tokens[position].type === 'closeBracket') {
        position++;
      } else {
        console.error('Expected closing bracket');
      }
      return expr;
    }
    
    if (position < tokens.length) {
      const token = tokens[position];
      position++;
      
      if (token.type === 'instrument') {
        return { type: 'instrument', value: String(token.value) };
      } else if (token.type === 'fixedValue' || token.type === 'number') {
        return { type: 'value', value: Number(token.value) };
      } else if (token.type === 'percentage') {
        return { type: 'value', value: Number(token.value) / 100 };
      }
    }
    
    return { type: 'value', value: 0 };
  }
  
  return parseExpression();
}
