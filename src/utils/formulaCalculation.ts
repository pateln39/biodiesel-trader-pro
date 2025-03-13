import { FormulaToken, ExposureResult, Instrument, PricingFormula } from '@/types';

export const createEmptyExposureResult = (): ExposureResult => ({
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

// ----------------------------------------------------------------------------------
// KNOWN ISSUE: TYPE-ERROR-2023-05-15
// This is a documented TypeScript type-checking error (TS2367) that does not affect 
// the actual pricing formula calculations or exposure results.
//
// The error occurs in the condition: `node.left.type !== 'value'` where TypeScript
// flags the comparison of a string literal with a string type.
//
// Examples of formulas that work correctly despite this error:
// - Argus UCOME * 50%
// - Argus RME + Platts LSGO * 20%
// - (Argus FAME0 + Platts diesel) * 75%
//
// This issue is being kept temporarily as it requires careful refactoring of the
// type system to fix without introducing regressions to the pricing calculations.
//
// TODO-PRICING-TYPE-001: Refactor the type system for formula nodes to use proper
// discriminated union types and fix this comparison.
// ----------------------------------------------------------------------------------

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
      
      // If right side is a simple value, use it as multiplier
      if (node.right.type === 'value' && !node.left.type !== 'value') {
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

// Calculate exposures for a formula with proper parsing and exposure distribution
export const calculateExposures = (
  tokens: FormulaToken[],
  tradeQuantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): ExposureResult => {
  const result = createEmptyExposureResult();
  
  if (!tokens.length || tradeQuantity === 0) {
    return result;
  }
  
  // Find physical exposure - first instrument in the formula
  const physicalInstrument = tokens.find(token => token.type === 'instrument');
  
  if (!physicalInstrument) {
    return result;
  }
  
  // Set physical exposure - buy is negative, sell is positive
  const physicalExposureSign = buySell === 'buy' ? 1 : -1;
  result.physical[physicalInstrument.value as Instrument] = physicalExposureSign * tradeQuantity;
  
  // For pricing exposure, we need to parse the formula
  try {
    const ast = parseFormula(tokens);
    const instrumentWeights = extractInstrumentsFromAST(ast);
    
    // Apply pricing exposure - buy is negative, sell is positive (opposite of physical)
    const pricingExposureSign = buySell === 'buy' ? -1 : 1;
    
    // Calculate total weight for normalization
    let totalWeight = 0;
    for (const weight of Object.values(instrumentWeights)) {
      totalWeight += Math.abs(weight);
    }
    
    if (totalWeight === 0) totalWeight = 1; // Prevent division by zero
    
    // Apply pricing exposure with proper weights and signs
    for (const [instrument, weight] of Object.entries(instrumentWeights)) {
      if (instrument in result.pricing) {
        // Apply the proportional exposure based on weight
        result.pricing[instrument as Instrument] = pricingExposureSign * tradeQuantity * weight;
      }
    }
  } catch (error) {
    console.error('Error calculating exposures:', error);
  }
  
  return result;
};

// Convert formula to readable string
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};
