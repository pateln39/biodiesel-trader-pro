import { FormulaToken, ExposureResult, Instrument, PricingFormula } from '@/types';
import { distributeQuantityByWorkingDays } from './workingDaysUtils';
import { MonthlyDistribution } from '@/types';

export const createEmptyExposureResult = (): ExposureResult => ({
  physical: {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  },
  pricing: {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  },
  monthlyDistribution: {}
});

// Helper function to check if a token is an instrument
export const isInstrument = (token: FormulaToken): boolean => token.type === 'instrument';

// Helper function to check if a token is an operator
export const isOperator = (token: FormulaToken): boolean => token.type === 'operator';

// Helper function to check if a token is a fixed value
export const isFixedValue = (token: FormulaToken): boolean => token.type === 'fixedValue';

// Helper function to check if a token is a percentage
export const isPercentage = (token: FormulaToken): boolean => token.type === 'percentage';

// Helper function to check if a token is an open bracket
export const isOpenBracket = (token: FormulaToken): boolean => token.type === 'openBracket';

// Helper function to check if a token is a close bracket
export const isCloseBracket = (token: FormulaToken): boolean => token.type === 'closeBracket';

// Helper function to check if token is a value (instrument, fixed value, or percentage)
export const isValue = (token: FormulaToken): boolean => 
  isInstrument(token) || isFixedValue(token) || isPercentage(token);

// Enhanced function to determine if we can add a token type at the current position
// with simplified rules that only enforce basic mathematical validity
export const canAddTokenType = (tokens: FormulaToken[], type: FormulaToken['type']): boolean => {
  if (tokens.length === 0) {
    // First token can be instrument, fixed value, or open bracket
    return ['instrument', 'fixedValue', 'openBracket'].includes(type);
  }

  const lastToken = tokens[tokens.length - 1];
  
  switch (type) {
    case 'instrument':
    case 'fixedValue':
      // Can add value after operator or open bracket or another value (implicit multiplication)
      return true;
    
    case 'operator':
      // Cannot add an operator after another operator or an open bracket
      return !isOperator(lastToken) && !isOpenBracket(lastToken);
    
    case 'percentage':
      // Modified: Can add percentage after values, close brackets, OR OPERATORS
      return isInstrument(lastToken) || isFixedValue(lastToken) || 
             isCloseBracket(lastToken) || isOperator(lastToken);
    
    case 'openBracket':
      // Can add open bracket anytime except after a value or close bracket (would require * operator)
      return isOperator(lastToken) || isOpenBracket(lastToken);
    
    case 'closeBracket': {
      // Cannot add close bracket after operator or open bracket
      if (isOperator(lastToken) || isOpenBracket(lastToken)) {
        return false;
      }
      
      // Count open and close brackets to ensure we don't have too many close brackets
      let openCount = 0;
      let closeCount = 0;
      
      for (const token of tokens) {
        if (isOpenBracket(token)) openCount++;
        if (isCloseBracket(token)) closeCount++;
      }
      
      return openCount > closeCount;
    }
    
    default:
      return false;
  }
};

// Parse tokens to build an AST for proper evaluation
interface Node {
  type: string;
  value?: any;
  left?: Node;
  right?: Node;
  operator?: string;
  percentage?: boolean;
  percentageValue?: number;
}

// Simple tokenizer for formula parsing
const tokenizeFormula = (tokens: FormulaToken[]): FormulaToken[] => {
  // Insert multiplication operators for implicit multiplication (e.g., 2(3+4) -> 2*(3+4))
  const result: FormulaToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    
    // Add implicit multiplication
    if (prevToken && 
        (isValue(prevToken) || isCloseBracket(prevToken)) && 
        (isValue(token) || isOpenBracket(token))) {
      // Add an implicit multiplication operator
      result.push({
        id: 'implicit-' + i,
        type: 'operator',
        value: '*'
      });
    }
    
    result.push(token);
  }
  
  return result;
};

// Parse formula tokens to build AST
// This is a simplified parser for demonstration - a real implementation would be more robust
const parseFormula = (tokens: FormulaToken[]): Node => {
  const processedTokens = tokenizeFormula(tokens);
  
  // Simple recursive descent parser
  let position = 0;
  
  // Parse expression with operator precedence
  const parseExpression = (): Node => {
    let left = parseTerm();
    
    while (position < processedTokens.length && 
          (processedTokens[position].type === 'operator' && 
           (processedTokens[position].value === '+' || processedTokens[position].value === '-'))) {
      const operator = processedTokens[position].value;
      position++;
      const right = parseTerm();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  };
  
  // Parse term (*, /)
  const parseTerm = (): Node => {
    let left = parseFactor();
    
    while (position < processedTokens.length && 
          (processedTokens[position].type === 'operator' && 
           (processedTokens[position].value === '*' || processedTokens[position].value === '/'))) {
      const operator = processedTokens[position].value;
      position++;
      const right = parseFactor();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  };
  
  // Parse factor (value, parenthesized expression)
  const parseFactor = (): Node => {
    if (position >= processedTokens.length) {
      return { type: 'value', value: 0 };
    }
    
    const token = processedTokens[position];
    
    if (isOpenBracket(token)) {
      position++; // Skip open bracket
      const node = parseExpression();
      
      if (position < processedTokens.length && isCloseBracket(processedTokens[position])) {
        position++; // Skip close bracket
      }
      
      // Check for percentage after parenthesis
      if (position < processedTokens.length && isPercentage(processedTokens[position])) {
        const percentValue = parseFloat(processedTokens[position].value);
        position++;
        return { 
          type: 'binary', 
          operator: '*', 
          left: node, 
          right: { type: 'value', value: percentValue / 100 } 
        };
      }
      
      return node;
    } else if (isInstrument(token)) {
      position++;
      const node: Node = { type: 'instrument', value: token.value };
      
      // Check for percentage after instrument
      if (position < processedTokens.length && isPercentage(processedTokens[position])) {
        const percentValue = parseFloat(processedTokens[position].value);
        position++;
        return { 
          type: 'binary', 
          operator: '*', 
          left: node, 
          right: { type: 'value', value: percentValue / 100 } 
        };
      }
      
      return node;
    } else if (isFixedValue(token)) {
      position++;
      const value = parseFloat(token.value);
      const node: Node = { type: 'value', value };
      
      // Check for percentage after fixed value
      if (position < processedTokens.length && isPercentage(processedTokens[position])) {
        const percentValue = parseFloat(processedTokens[position].value);
        position++;
        return { 
          type: 'binary', 
          operator: '*', 
          left: node, 
          right: { type: 'value', value: percentValue / 100 } 
        };
      }
      
      return node;
    } else if (isPercentage(token)) {
      position++;
      const value = parseFloat(token.value) / 100;
      return { type: 'value', value };
    } else if (isOperator(token) && (token.value === '+' || token.value === '-')) {
      // Unary plus or minus
      position++;
      const factor = parseFactor();
      return { type: 'unary', operator: token.value, right: factor };
    }
    
    // Skip unknown tokens
    position++;
    return { type: 'value', value: 0 };
  };
  
  const ast = parseExpression();
  return ast;
};

// Extract instruments from AST
const extractInstrumentsFromAST = (
  node: Node, 
  multiplier: number = 1
): Record<string, number> => {
  const instruments: Record<string, number> = {};
  
  if (!node) return instruments;
  
  if (node.type === 'instrument') {
    instruments[node.value as string] = multiplier;
  } else if (node.type === 'binary') {
    if (node.operator === '+') {
      const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
      const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(leftInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else if (node.operator === '-') {
      const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
      const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(leftInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else if (node.operator === '*') {
      // When we multiply, we need to determine the multiplier first
      let newMultiplier = multiplier;
      
      // FIX: Corrected the type comparison condition
      // If right side is a simple value, use it as multiplier
      if (node.right.type === 'value' && node.left.type !== 'value') {
        const rightMultiplier = node.right.value;
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier * rightMultiplier);
        
        // Merge instruments
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } 
      // If left side is a simple value, use it as multiplier
      else if (node.left.type === 'value' && node.right.type !== 'value') {
        const leftMultiplier = node.left.value;
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier * leftMultiplier);
        
        // Merge instruments
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } else {
        // Complex multiplication - this is a simplification
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
        
        // In complex multiplication, we would need to do some weighted distribution
        // This is a simplified approach for demonstration
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
        
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      }
    } else if (node.operator === '/') {
      // Division - simplification for demonstration
      if (node.right.type === 'value') {
        const divisor = node.right.value;
        if (divisor !== 0) {
          const leftInstruments = extractInstrumentsFromAST(node.left, multiplier / divisor);
          
          // Merge instruments
          for (const [instrument, value] of Object.entries(leftInstruments)) {
            instruments[instrument] = (instruments[instrument] || 0) + value;
          }
        }
      } else {
        // Complex division - simplification
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
        const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
        
        // Merge instruments (simplification)
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
        
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      }
    }
  } else if (node.type === 'unary') {
    if (node.operator === '-') {
      const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else {
      const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    }
  }
  
  return instruments;
};

// Calculate exposures including monthly distributions
export function calculateExposures(
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell' = 'buy',
  selectedProduct?: string,
  pricingPeriodStart?: Date,
  pricingPeriodEnd?: Date
): ExposureResult {
  console.log(`Calculating exposures with dates:`, {
    pricingPeriodStart: pricingPeriodStart?.toISOString(),
    pricingPeriodEnd: pricingPeriodEnd?.toISOString(),
    quantity,
    buySell,
    selectedProduct
  });
  
  const signMultiplier = buySell === 'buy' ? 1 : -1;
  const actualQuantity = quantity * signMultiplier;
  
  // Calculate the product exposures
  const physicalExposure = calculatePhysicalExposure(tokens, quantity, buySell);
  const pricingExposure = calculatePricingExposure(tokens, quantity, buySell);
  
  // Create monthly distribution if we have pricing period dates
  const monthlyDistribution: Record<string, Record<string, number>> = {};
  
  if (pricingPeriodStart && pricingPeriodEnd) {
    console.log(`Generating monthly distribution for ${pricingPeriodStart.toISOString()} to ${pricingPeriodEnd.toISOString()}`);
    
    // Process physical exposures for distribution
    Object.entries(physicalExposure).forEach(([instrument, exposure]) => {
      if (exposure !== 0) {
        const instrumentExposure = Math.abs(exposure);
        
        console.log(`Distributing ${instrumentExposure} for ${instrument} (physical)`);
        const distribution = distributeQuantityByWorkingDays(
          pricingPeriodStart,
          pricingPeriodEnd,
          instrumentExposure
        );
        
        // Handle buySell sign for the distributed values
        const signedDistribution: Record<string, number> = {};
        Object.entries(distribution).forEach(([month, value]) => {
          signedDistribution[month] = value * Math.sign(exposure);
        });
        
        monthlyDistribution[instrument] = signedDistribution;
      }
    });
    
    // Process pricing exposures for distribution
    Object.entries(pricingExposure).forEach(([instrument, exposure]) => {
      if (exposure !== 0) {
        const instrumentExposure = Math.abs(exposure);
        
        console.log(`Distributing ${instrumentExposure} for ${instrument} (pricing)`);
        const distribution = distributeQuantityByWorkingDays(
          pricingPeriodStart,
          pricingPeriodEnd,
          instrumentExposure
        );
        
        // Handle buySell sign for the distributed values
        const signedDistribution: Record<string, number> = {};
        Object.entries(distribution).forEach(([month, value]) => {
          signedDistribution[month] = value * Math.sign(exposure);
        });
        
        // Add to existing distribution or create new
        if (monthlyDistribution[instrument]) {
          Object.entries(signedDistribution).forEach(([month, value]) => {
            if (monthlyDistribution[instrument][month]) {
              // Only add pricing exposure if it doesn't already exist
              // Usually we'd want to keep these separate to avoid double-counting
              console.log(`Month ${month} already exists for ${instrument}, not adding pricing exposure`);
            } else {
              monthlyDistribution[instrument][month] = value;
            }
          });
        } else {
          monthlyDistribution[instrument] = signedDistribution;
        }
      }
    });
  }
  
  return {
    physical: physicalExposure,
    pricing: pricingExposure,
    monthlyDistribution
  };
}

// Calculate physical exposure from formula tokens
export function calculatePhysicalExposure(
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): Record<Instrument, number> {
  console.log(`Calculating physical exposure for ${quantity} units, buySell: ${buySell}`);
  
  const result = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  };
  
  const signMultiplier = buySell === 'buy' ? 1 : -1;
  const actualQuantity = quantity * signMultiplier;
  
  // Count all instruments in the formula
  let instrumentsCount = 0;
  tokens.forEach(token => {
    if (token.type === 'instrument') {
      instrumentsCount++;
    }
  });
  
  if (instrumentsCount === 0) {
    console.log('No instruments found in formula, returning empty exposure');
    return result;
  }
  
  // Simple case: if only one instrument, 100% exposure to that instrument
  if (instrumentsCount === 1) {
    const instrument = tokens.find(token => token.type === 'instrument')?.value as Instrument;
    if (instrument && Object.keys(result).includes(instrument)) {
      console.log(`Single instrument formula: ${instrument}, quantity: ${actualQuantity}`);
      result[instrument] = actualQuantity;
    }
    return result;
  }
  
  // More complex case: multiple instruments, divide exposure equally
  // (A very simplified approach - in a real system this would account for weights)
  const instrumentWeight = 1 / instrumentsCount;
  tokens.forEach(token => {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      if (Object.keys(result).includes(instrument)) {
        result[instrument] = actualQuantity * instrumentWeight;
        console.log(`Multiple instruments, ${instrument}: ${actualQuantity * instrumentWeight}`);
      }
    }
  });
  
  return result;
}

// Calculate pricing exposure from formula tokens
export function calculatePricingExposure(
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): Record<Instrument, number> {
  console.log(`Calculating pricing exposure for ${quantity} units, buySell: ${buySell}`);
  
  // The pricing exposure is the exact opposite of the physical exposure
  // This is a simplified model - in a real system with complex formulas,
  // the pricing exposure would be calculated differently
  const physicalExposure = calculatePhysicalExposure(tokens, quantity, buySell);
  const result = { ...physicalExposure };
  
  // Invert the signs for pricing exposure
  Object.keys(result).forEach(key => {
    const instrument = key as Instrument;
    result[instrument] = -result[instrument];
    
    if (result[instrument] !== 0) {
      console.log(`Pricing exposure for ${instrument}: ${result[instrument]}`);
    }
  });
  
  return result;
}

// Convert formula to readable string
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};
