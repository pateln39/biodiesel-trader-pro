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

export const isInstrument = (token: FormulaToken): boolean => token.type === 'instrument';

export const isOperator = (token: FormulaToken): boolean => token.type === 'operator';

export const isFixedValue = (token: FormulaToken): boolean => token.type === 'fixedValue';

export const isPercentage = (token: FormulaToken): boolean => token.type === 'percentage';

export const isOpenBracket = (token: FormulaToken): boolean => token.type === 'openBracket';

export const isCloseBracket = (token: FormulaToken): boolean => token.type === 'closeBracket';

export const isValue = (token: FormulaToken): boolean => 
  isInstrument(token) || isFixedValue(token) || isPercentage(token);

export const canAddTokenType = (tokens: FormulaToken[], type: FormulaToken['type']): boolean => {
  if (tokens.length === 0) {
    return ['instrument', 'fixedValue', 'openBracket'].includes(type);
  }

  const lastToken = tokens[tokens.length - 1];
  
  switch (type) {
    case 'instrument':
    case 'fixedValue':
      return true;
    
    case 'operator':
      return !isOperator(lastToken) && !isOpenBracket(lastToken);
    
    case 'percentage':
      return isInstrument(lastToken) || isFixedValue(lastToken) || 
             isCloseBracket(lastToken) || isOperator(lastToken);
    
    case 'openBracket':
      return isOperator(lastToken) || isOpenBracket(lastToken);
    
    case 'closeBracket': {
      if (isOperator(lastToken) || isOpenBracket(lastToken)) {
        return false;
      }
      
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

interface Node {
  type: string;
  value?: any;
  left?: Node;
  right?: Node;
  operator?: string;
  percentage?: boolean;
  percentageValue?: number;
}

const tokenizeFormula = (tokens: FormulaToken[]): FormulaToken[] => {
  const result: FormulaToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    
    if (prevToken && 
        (isValue(prevToken) || isCloseBracket(prevToken)) && 
        (isValue(token) || isOpenBracket(token))) {
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

const parseFormula = (tokens: FormulaToken[]): Node => {
  const processedTokens = tokenizeFormula(tokens);
  
  let position = 0;
  
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
  
  const parseFactor = (): Node => {
    if (position >= processedTokens.length) {
      return { type: 'value', value: 0 };
    }
    
    const token = processedTokens[position];
    
    if (isOpenBracket(token)) {
      position++;
      const node = parseExpression();
      
      if (position < processedTokens.length && isCloseBracket(processedTokens[position])) {
        position++;
      }
      
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
      position++;
      const factor = parseFactor();
      return { type: 'unary', operator: token.value, right: factor };
    }
    
    position++;
    return { type: 'value', value: 0 };
  };
  
  const ast = parseExpression();
  return ast;
};

const extractInstrumentsFromAST = (
  node: Node, 
  multiplier: number = 1
): Record<string, number> => {
  const instruments: Record<string, number> = {};
  
  if (!node) return instruments;
  
  if (node.type === 'instrument') {
    instruments[node.value as string] = multiplier;
    console.log(`Found instrument ${node.value} with coefficient ${multiplier}`);
  } else if (node.type === 'binary') {
    if (node.operator === '+') {
      const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
      const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
      
      for (const [instrument, value] of Object.entries(leftInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else if (node.operator === '-') {
      const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
      const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
      
      for (const [instrument, value] of Object.entries(leftInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else if (node.operator === '*') {
      if (node.right.type === 'value' && node.left.type === 'instrument') {
        const coefficient = node.right.value;
        instruments[node.left.value] = multiplier * coefficient;
        console.log(`Instrument ${node.left.value} * ${coefficient} = ${multiplier * coefficient}`);
      } else if (node.left.type === 'value' && node.right.type === 'instrument') {
        const coefficient = node.left.value;
        instruments[node.right.value] = multiplier * coefficient;
        console.log(`Value ${coefficient} * instrument ${node.right.value} = ${multiplier * coefficient}`);
      } else if (node.right.type === 'value' && node.left.type !== 'value') {
        const rightMultiplier = node.right.value;
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier * rightMultiplier);
        
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } else if (node.left.type === 'value' && node.right.type !== 'value') {
        const leftMultiplier = node.left.value;
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier * leftMultiplier);
        
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } else {
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
        
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
        
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      }
    } else if (node.operator === '/') {
      if (node.right.type === 'value') {
        const divisor = node.right.value;
        if (divisor !== 0) {
          const leftInstruments = extractInstrumentsFromAST(node.left, multiplier / divisor);
          
          for (const [instrument, value] of Object.entries(leftInstruments)) {
            instruments[instrument] = (instruments[instrument] || 0) + value;
          }
        }
      } else {
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
        const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
        
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
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else {
      const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    }
  }
  
  return instruments;
};

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
  
  const physicalExposure = calculatePhysicalExposure(tokens, quantity, buySell);
  const pricingExposure = calculatePricingExposure(tokens, quantity, buySell);
  
  const monthlyDistribution: Record<string, Record<string, number>> = {};
  
  if (pricingPeriodStart && pricingPeriodEnd) {
    console.log(`Generating ${formulaType} monthly distribution for ${pricingPeriodStart.toISOString()} to ${pricingPeriodEnd.toISOString()}`);
    
    if (formulaType === 'price') {
      Object.entries(physicalExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Distributing price physical exposure for ${instrument}: ${exposure}`);
          
          const distribution = distributeQuantityByWorkingDays(
            pricingPeriodStart,
            pricingPeriodEnd,
            Math.abs(exposure)
          );
          
          const signedDistribution: Record<string, number> = {};
          const sign = Math.sign(exposure);
          
          Object.entries(distribution).forEach(([month, value]) => {
            signedDistribution[month] = value * sign;
            console.log(`Physical monthly distribution for ${instrument} ${month}: ${value} * ${sign} = ${value * sign}`);
          });
          
          monthlyDistribution[instrument] = signedDistribution;
        }
      });
      
      Object.entries(pricingExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Distributing price pricing exposure for ${instrument}: ${exposure}`);
          
          const distribution = distributeQuantityByWorkingDays(
            pricingPeriodStart,
            pricingPeriodEnd,
            Math.abs(exposure)
          );
          
          const signedDistribution: Record<string, number> = {};
          const sign = Math.sign(exposure);
          
          Object.entries(distribution).forEach(([month, value]) => {
            signedDistribution[month] = value * sign;
            console.log(`Pricing monthly distribution for ${instrument} ${month}: ${value} * ${sign} = ${value * sign}`);
          });
          
          if (monthlyDistribution[instrument]) {
            Object.entries(signedDistribution).forEach(([month, value]) => {
              monthlyDistribution[instrument][month] = value;
            });
          } else {
            monthlyDistribution[instrument] = signedDistribution;
          }
        }
      });
    } else if (formulaType === 'mtm') {
      Object.entries(physicalExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Handling MTM physical exposure for ${instrument}: ${exposure}`);
          
          if (loadingPeriodStart) {
            const loadingStartMonth = new Date(loadingPeriodStart);
            const monthName = loadingStartMonth.toLocaleString('en-US', { month: 'short' });
            const year = loadingStartMonth.getFullYear().toString().slice(-2);
            const monthCode = `${monthName}-${year}`;
            
            console.log(`Assigning MTM physical exposure to loading period start month: ${monthCode}`);
            
            const signedDistribution: Record<string, number> = {
              [monthCode]: exposure
            };
            
            monthlyDistribution[instrument] = signedDistribution;
          } else {
            console.log(`No loading period start date provided for MTM physical exposure, using pricing period start month instead`);
            
            const pricingStartMonth = new Date(pricingPeriodStart);
            const monthName = pricingStartMonth.toLocaleString('en-US', { month: 'short' });
            const year = pricingStartMonth.getFullYear().toString().slice(-2);
            const monthCode = `${monthName}-${year}`;
            
            const signedDistribution: Record<string, number> = {
              [monthCode]: exposure
            };
            
            monthlyDistribution[instrument] = signedDistribution;
          }
        }
      });
      
      Object.entries(pricingExposure).forEach(([instrument, exposure]) => {
        if (exposure !== 0) {
          console.log(`Distributing MTM pricing exposure for ${instrument}: ${exposure}`);
          
          const distribution = distributeQuantityByWorkingDays(
            pricingPeriodStart,
            pricingPeriodEnd,
            Math.abs(exposure)
          );
          
          const signedDistribution: Record<string, number> = {};
          const sign = Math.sign(exposure);
          
          Object.entries(distribution).forEach(([month, value]) => {
            signedDistribution[month] = value * sign;
            console.log(`MTM pricing monthly distribution for ${instrument} ${month}: ${value} * ${sign} = ${value * sign}`);
          });
          
          if (monthlyDistribution[instrument]) {
            Object.entries(signedDistribution).forEach(([month, value]) => {
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
  
  const ast = parseFormula(tokens);
  const instrumentCoefficients = extractInstrumentsFromAST(ast);
  
  console.log('Extracted instrument coefficients from formula:', instrumentCoefficients);
  
  Object.entries(instrumentCoefficients).forEach(([instrument, coefficient]) => {
    if (Object.keys(result).includes(instrument)) {
      result[instrument as Instrument] = actualQuantity * coefficient;
      console.log(`Physical exposure for ${instrument}: ${actualQuantity} * ${coefficient} = ${actualQuantity * coefficient}`);
    }
  });
  
  return result;
}

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
  
  const ast = parseFormula(tokens);
  const instrumentCoefficients = extractInstrumentsFromAST(ast);
  
  console.log('Extracted instrument coefficients for pricing:', instrumentCoefficients);
  
  const result = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  };
  
  Object.entries(instrumentCoefficients).forEach(([instrument, coefficient]) => {
    if (Object.keys(result).includes(instrument)) {
      result[instrument as Instrument] = -1 * actualQuantity * coefficient;
      console.log(`Pricing exposure for ${instrument}: -1 * ${actualQuantity} * ${coefficient} = ${-1 * actualQuantity * coefficient}`);
    }
  });
  
  return result;
}

export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};
