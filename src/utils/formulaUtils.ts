
import { FormulaNode, Instrument, PricingFormula } from '@/types';

// Generate a unique ID for formula nodes
export const generateNodeId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Create a new instrument node
export const createInstrumentNode = (instrument: Instrument): FormulaNode => {
  return {
    id: generateNodeId(),
    type: 'instrument',
    value: instrument,
  };
};

// Create a new fixed value node
export const createFixedValueNode = (value: number): FormulaNode => {
  return {
    id: generateNodeId(),
    type: 'fixedValue',
    value: value.toString(),
  };
};

// Create a new operator node
export const createOperatorNode = (operator: string): FormulaNode => {
  return {
    id: generateNodeId(),
    type: 'operator',
    value: operator,
  };
};

// Create a new group node
export const createGroupNode = (children: FormulaNode[] = []): FormulaNode => {
  return {
    id: generateNodeId(),
    type: 'group',
    value: '()',
    children,
  };
};

// Create a new empty formula
export const createEmptyFormula = (): PricingFormula => {
  const instrumentNode = createInstrumentNode('Argus UCOME');
  
  return {
    root: instrumentNode,
    exposures: {
      'Argus UCOME': 1,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Platts LSGO': 0,
      'Platts diesel': 0,
    },
  };
};

// Convert formula to string representation
export const formulaToString = (node: FormulaNode): string => {
  if (!node) return '';

  if (node.type === 'instrument') {
    return node.value;
  }

  if (node.type === 'fixedValue') {
    return node.value;
  }

  if (node.type === 'operator') {
    return node.value;
  }

  if (node.type === 'group' && node.children) {
    const childrenStr = node.children.map(formulaToString).join(' ');
    return `(${childrenStr})`;
  }

  return '';
};

// Calculate exposures for a formula
export const calculateExposures = (
  formula: FormulaNode,
  tradeQuantity: number
): Record<Instrument, number> => {
  // Initialize all instruments with zero exposure
  const exposures: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };

  // Simple implementation - in a real system this would be more complex
  // to handle nested formulas, operators, etc.
  if (formula.type === 'instrument') {
    exposures[formula.value as Instrument] = -tradeQuantity; // Negative because buying physical creates negative price exposure
  }

  return exposures;
};

// Helper to convert between old pricingFormula format and new formula format
export const convertToNewFormulaFormat = (pricingComponents: any[]): PricingFormula => {
  if (!pricingComponents || pricingComponents.length === 0) {
    return createEmptyFormula();
  }

  // For simplicity, just take the first component and convert it
  const firstComponent = pricingComponents[0];
  const instrumentNode = createInstrumentNode(firstComponent.instrument);
  
  const exposures: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };
  
  // Set exposure for the chosen instrument
  exposures[firstComponent.instrument] = firstComponent.percentage / 100;
  
  return {
    root: instrumentNode,
    exposures,
  };
};

// Convert from formula format to pricingComponents format
export const convertToTraditionalFormat = (formula: PricingFormula): any[] => {
  if (!formula || !formula.root) {
    return [{
      instrument: 'Argus UCOME',
      percentage: 100,
      adjustment: 0
    }];
  }
  
  const exposures = formula.exposures;
  return Object.entries(exposures)
    .filter(([_, value]) => value !== 0)
    .map(([instrument, value]) => ({
      instrument,
      percentage: Math.abs(value * 100),
      adjustment: 0
    }));
};
