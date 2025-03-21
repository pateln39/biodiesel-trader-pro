
import { PhysicalFormulaToken, PhysicalFormulaConfig, PhysicalExposureResult } from '@/types/physicalFormula';
import { PaperFormulaToken, PaperPricingFormula, PaperExposureResult } from '@/types/paperFormula';
import { Instrument } from '@/types/common';
import { createEmptyPhysicalFormula } from './physicalFormulaUtils';
import { createEmptyFormula } from './paperFormulaUtils';

/**
 * Adapts a physical formula to a paper formula format
 * This is useful during the transition period while we're refactoring components
 */
export const adaptPhysicalFormulaToPaper = (physicalFormula: PhysicalFormulaConfig | undefined): PaperPricingFormula => {
  if (!physicalFormula) {
    return createEmptyFormula();
  }

  // Create paper formula tokens from physical tokens
  const paperTokens: PaperFormulaToken[] = physicalFormula.tokens.map(token => {
    // Generate a unique ID for the paper token
    const id = Math.random().toString(36).substring(2, 9);
    
    let type: string;
    switch (token.type) {
      case 'number':
        type = 'fixedValue';
        break;
      case 'operator':
        type = 'operator';
        break;
      case 'variable':
        type = 'instrument';
        break;
      case 'function':
        type = 'fixedValue'; // Fallback, might need more complex logic
        break;
      default:
        type = 'fixedValue';
    }
    
    return {
      id,
      type: type as any,
      value: token.value.toString(),
    };
  });

  // Create empty exposures
  const emptyExposures = {
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
  };

  return {
    tokens: paperTokens,
    exposures: emptyExposures
  };
};

/**
 * Adapts a paper formula to a physical formula format
 */
export const adaptPaperFormulaToPhysical = (paperFormula: PaperPricingFormula | undefined): PhysicalFormulaConfig => {
  if (!paperFormula) {
    return createEmptyPhysicalFormula();
  }

  // Create physical tokens from paper tokens
  const physicalTokens: PhysicalFormulaToken[] = paperFormula.tokens.map(token => {
    let type: "number" | "operator" | "variable" | "function";
    
    switch (token.type) {
      case 'fixedValue':
        type = 'number';
        break;
      case 'operator':
        type = 'operator';
        break;
      case 'instrument':
        type = 'variable';
        break;
      case 'percentage':
        type = 'number';
        break;
      case 'openBracket':
      case 'closeBracket':
        type = 'operator';
        break;
      default:
        type = 'number';
    }
    
    return {
      type,
      value: token.type === 'percentage' 
        ? Number(token.value) / 100 // Convert percentage to decimal
        : token.value
    };
  });

  return {
    tokens: physicalTokens,
  };
};

// Helper function to determine if a formula is a paper formula
export const isPaperFormula = (formula: any): formula is PaperPricingFormula => {
  return formula && 
    Array.isArray(formula.tokens) && 
    formula.tokens.length > 0 && 
    typeof formula.tokens[0].id === 'string';
};

// Helper function to determine if a formula is a physical formula
export const isPhysicalFormula = (formula: any): formula is PhysicalFormulaConfig => {
  return formula && 
    Array.isArray(formula.tokens) && 
    formula.tokens.length > 0 && 
    typeof formula.tokens[0].type === 'string' &&
    !("id" in formula.tokens[0]);
};
