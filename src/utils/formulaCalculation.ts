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

// Enhanced function to extract instruments with their coefficients from AST
const extractInstrumentsFromAST = (
  node: Node, 
  multiplier: number = 1
): Record<string, number> => {
  const instruments: Record<string, number> = {};
  
  if (!node) return instruments;
  
  if (node.type === 'instrument') {
    // For instrument nodes, assign the current multiplier to represent the coefficient
    instruments[node.value as string] = multiplier;
    console.log(`Found instrument ${node.value} with coefficient ${multiplier}`);
  } else if (node.type === 'binary') {
    if (node.operator === '+') {
      // For addition, process both sides with the same multiplier
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
      // For subtraction, process right side with inverted multiplier
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
      // Multiply by numeric coefficient - this is key for correct exposure calculation
      if (node.right.type === 'value' && node.left.type === 'instrument') {
        // Case: instrument * value
        const coefficient = node.right.value;
        instruments[node.left.value] = multiplier * coefficient;
        console.log(`Instrument ${node.left.value} * ${coefficient} = ${multiplier * coefficient}`);
      } else if (node.left.type === 'value' && node.right.type === 'instrument') {
        // Case: value * instrument
        const coefficient = node.left.value;
        instruments[node.right.value] = multiplier * coefficient;
        console.log(`Value ${coefficient} * instrument ${node.right.value} = ${multiplier * coefficient}`);
      } else if (node.right.type === 'value' && node.left.type !== 'value') {
        // Case: complex_expression * value
        const rightMultiplier = node.right.value;
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier * rightMultiplier);
        
        // Merge instruments
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } else if (node.left.type === 'value' && node.right.type !== 'value') {
        // Case: value * complex_expression
        const leftMultiplier = node.left.value;
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier * leftMultiplier);
        
        // Merge instruments
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } else {
        // Complex multiplication
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
        
        // For complex multiplication between instruments, assume both are weighted equally
        // This is a simplification as real formulas usually don't multiply instruments directly
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
        
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      }
    } else if (node.operator === '/') {
      // Division - handle coefficient division
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
        // Division by an instrument is rare, but we'll handle it as a negative contribution
        const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
        
        // Merge instruments
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
  pricingPeriodEnd?: Date,
  formulaType: 'price' | 'mtm' = 'price',
  loadingPeriodStart?: Date
): ExposureResult {
  console.log(`Calculating ${formulaType} exposures with dates:`, {
    pricingPeriodStart: pricingPeriodStart?.toISOString(),
    pricingPeriodEnd: pricingPeriodEnd?.toISOString(),
    loadingPeriodStart: loadingPeriodStart?.toISOString(),
    quantity,
    buySell,
    selectedProduct,
    formulaType
  });
  
  const signMultiplier = buySell === 'buy' ? 1 : -1;
  const actualQuantity = quantity * signMultiplier;
  
  // Calculate the product exposures
  const physicalExposure = calculatePhysicalExposure(tokens, quantity, buySell);
  const pricingExposure = calculatePricingExposure(tokens, quantity, buySell);
  
  // Create monthly distribution if we have pricing period dates
  const monthlyDistribution: Record<string, Record<string, number>> = {};
  
  if (pricingPeriodStart && pricingPeriodEnd) {
    console.log(`Generating ${formulaType} monthly distribution for ${pricingPeriodStart.toISOString()} to ${pricingPeriodEnd.toISOString()}`);
    
    // For price formula, we distribute physical exposures
    // For MTM formula, we distribute MTM physical exposures
    if (formulaType === 'price') {
      // Process physical exposures for price formula distribution
      Object.entries(physicalExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Distributing price physical exposure for ${instrument}: ${exposure}`);
          
          // Generate distribution based on working days
          const distribution = distributeQuantityByWorkingDays(
            pricingPeriodStart,
            pricingPeriodEnd,
            Math.abs(exposure)
          );
          
          // Apply the sign from the original exposure
          const signedDistribution: Record<string, number> = {};
          const sign = Math.sign(exposure);
          
          Object.entries(distribution).forEach(([month, value]) => {
            signedDistribution[month] = value * sign;
            console.log(`Physical monthly distribution for ${instrument} ${month}: ${value} * ${sign} = ${value * sign}`);
          });
          
          monthlyDistribution[instrument] = signedDistribution;
        }
      });
      
      // Process pricing exposures for price formula distribution
      Object.entries(pricingExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Distributing price pricing exposure for ${instrument}: ${exposure}`);
          
          // Generate distribution based on working days
          const distribution = distributeQuantityByWorkingDays(
            pricingPeriodStart,
            pricingPeriodEnd,
            Math.abs(exposure)
          );
          
          // Apply the sign from the original exposure
          const signedDistribution: Record<string, number> = {};
          const sign = Math.sign(exposure);
          
          Object.entries(distribution).forEach(([month, value]) => {
            signedDistribution[month] = value * sign;
            console.log(`Pricing monthly distribution for ${instrument} ${month}: ${value} * ${sign} = ${value * sign}`);
          });
          
          // Add to existing distribution or create new
          if (monthlyDistribution[instrument]) {
            Object.entries(signedDistribution).forEach(([month, value]) => {
              // For price formula, pricing exposures override physical exposures
              monthlyDistribution[instrument][month] = value;
            });
          } else {
            monthlyDistribution[instrument] = signedDistribution;
          }
        }
      });
    } 
    else if (formulaType === 'mtm') {
      // For MTM formula, distribute physical exposures based on loading period start date
      // and pricing exposures based on pricing period (as before)
      
      // 1. Handle physical exposures - new logic using loadingPeriodStart
      Object.entries(physicalExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Handling MTM physical exposure for ${instrument}: ${exposure}`);
          
          if (loadingPeriodStart) {
            // Get month code for the loading period start month (e.g., "Mar-25")
            const loadingStartMonth = new Date(loadingPeriodStart);
            const monthName = loadingStartMonth.toLocaleString('en-US', { month: 'short' });
            const year = loadingStartMonth.getFullYear().toString().slice(-2);
            const monthCode = `${monthName}-${year}`;
            
            console.log(`Assigning MTM physical exposure to loading period start month: ${monthCode}`);
            
            // Create a distribution with 100% of the exposure in the loading month
            const signedDistribution: Record<string, number> = {
              [monthCode]: exposure
            };
            
            // Store the distribution for this instrument
            monthlyDistribution[instrument] = signedDistribution;
          } else {
            console.log(`No loading period start date provided for MTM physical exposure, using pricing period instead`);
            
            // Fallback to pricing period if no loading period start is provided
            const distribution = distributeQuantityByWorkingDays(
              pricingPeriodStart,
              pricingPeriodEnd,
              Math.abs(exposure)
            );
            
            // Apply the sign from the original physical exposure
            const signedDistribution: Record<string, number> = {};
            const sign = Math.sign(exposure);
            
            Object.entries(distribution).forEach(([month, value]) => {
              signedDistribution[month] = value * sign;
              console.log(`MTM physical monthly distribution for ${instrument} ${month}: ${value} * ${sign} = ${value * sign}`);
            });
            
            monthlyDistribution[instrument] = signedDistribution;
          }
        }
      });
      
      // 2. Handle pricing exposures - keep the existing logic for pricing exposure distribution
      // MTM pricing exposures are still prorated over the pricing period (not changed)
      Object.entries(pricingExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Distributing MTM pricing exposure for ${instrument}: ${exposure}`);
          
          // Generate distribution based on working days (keep prorating for pricing exposures)
          const distribution = distributeQuantityByWorkingDays(
            pricingPeriodStart,
            pricingPeriodEnd,
            Math.abs(exposure)
          );
          
          // Apply the sign from the original exposure
          const signedDistribution: Record<string, number> = {};
          const sign = Math.sign(exposure);
          
          Object.entries(distribution).forEach(([month, value]) => {
            signedDistribution[month] = value * sign;
            console.log(`MTM pricing monthly distribution for ${instrument} ${month}: ${value} * ${sign} = ${value * sign}`);
          });
          
          // Store the distribution for this instrument, or merge with existing
          if (monthlyDistribution[instrument]) {
            // Don't override physical exposures that were already set
            Object.entries(signedDistribution).forEach(([month, value]) => {
              // For pricing exposures, we don't want to overwrite physical exposures
              // that were set based on loading period
              if (!monthlyDistribution[instrument][month]) {
                monthlyDistribution[instrument][month] = value;
              }
            });
          } else {
            monthlyDistribution[instrument] = signedDistribution;
          }
        }
      });
    }
  }
  
  return {
    physical: physicalExposure,
    pricing: pricingExposure,
    monthlyDistribution
  };
}

// Calculate physical exposure from formula tokens - NOW USING THE AST PARSER
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
  
  if (tokens.length === 0 || quantity === 0) {
    console.log('No formula tokens or zero quantity, returning empty exposure');
    return result;
  }
  
  const signMultiplier = buySell === 'buy' ? 1 : -1;
  const actualQuantity = quantity * signMultiplier;
  
  // Parse the formula and extract instruments with coefficients
  const ast = parseFormula(tokens);
  const instrumentCoefficients = extractInstrumentsFromAST(ast);
  
  console.log('Extracted instrument coefficients from formula:', instrumentCoefficients);
  
  // Calculate physical exposure for each instrument based on its coefficient in the formula
  Object.entries(instrumentCoefficients).forEach(([instrument, coefficient]) => {
    // Apply the coefficient to the actual quantity to get the exposure
    if (Object.keys(result).includes(instrument)) {
      result[instrument as Instrument] = actualQuantity * coefficient;
      console.log(`Physical exposure for ${instrument}: ${actualQuantity} * ${coefficient} = ${actualQuantity * coefficient}`);
    }
  });
  
  return result;
}

// Calculate pricing exposure from formula tokens - NOW USING THE AST PARSER
export function calculatePricingExposure(
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): Record<Instrument, number> {
  console.log(`Calculating pricing exposure for ${quantity} units, buySell: ${buySell}`);
  
  if (tokens.length === 0 || quantity === 0) {
    console.log('No formula tokens or zero quantity, returning empty exposure');
    return {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Argus HVO': 0,
      'Platts LSGO': 0,
      'Platts Diesel': 0,
      'ICE GASOIL FUTURES': 0,
    };
  }
  
  const signMultiplier = buySell === 'buy' ? 1 : -1;
  const actualQuantity = quantity * signMultiplier;
  
  // Parse the formula and extract instruments with coefficients
  const ast = parseFormula(tokens);
  const instrumentCoefficients = extractInstrumentsFromAST(ast);
  
  console.log('Extracted instrument coefficients for pricing:', instrumentCoefficients);
  
  // For pricing, the exposure is the opposite of the physical exposure
  const result = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  };
  
  // Calculate pricing exposure (opposite of physical exposure)
  Object.entries(instrumentCoefficients).forEach(([instrument, coefficient]) => {
    if (Object.keys(result).includes(instrument)) {
      // Invert the sign for pricing exposure
      result[instrument as Instrument] = -1 * actualQuantity * coefficient;
      console.log(`Pricing exposure for ${instrument}: -1 * ${actualQuantity} * ${coefficient} = ${-1 * actualQuantity * coefficient}`);
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
