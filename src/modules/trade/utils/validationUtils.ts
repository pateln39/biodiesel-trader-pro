
// Re-export core validation utilities
export {
  validateDateRange,
  validateRequiredField,
  validateFields
} from '@/core/utils/validationUtils';

// Additional validation utilities specific to trades
import { toast } from 'sonner';
import { TokenType } from '@/modules/trade/types/common';
import { FormulaToken } from '@/modules/trade/types/pricing';

/**
 * Validate a numeric range
 */
export const validateNumberRange = (
  value: number | null | undefined,
  min: number,
  max: number,
  fieldName: string
): boolean => {
  if (value === null || value === undefined) {
    toast.error(`${fieldName} required`, {
      description: `Please enter a value for ${fieldName}.`
    });
    return false;
  }

  if (value < min || value > max) {
    toast.error(`Invalid ${fieldName}`, {
      description: `${fieldName} must be between ${min} and ${max}.`
    });
    return false;
  }

  return true;
};

/**
 * Validate a formula
 */
export const validateFormula = (
  tokens: FormulaToken[],
  formulaType: string
): boolean => {
  if (!tokens || tokens.length === 0) {
    toast.error(`Empty formula`, {
      description: `Please build a ${formulaType} formula before saving.`
    });
    return false;
  }

  // Check for basic formula structure
  let openBrackets = 0;
  let hasInstrument = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Track brackets
    if (token.type === 'openBracket') {
      openBrackets++;
    } else if (token.type === 'closeBracket') {
      openBrackets--;
      if (openBrackets < 0) {
        toast.error(`Invalid brackets`, {
          description: `Formula has mismatched brackets.`
        });
        return false;
      }
    }
    
    // Ensure at least one instrument
    if (token.type === 'instrument') {
      hasInstrument = true;
    }
  }
  
  // Check final bracket balance
  if (openBrackets !== 0) {
    toast.error(`Invalid brackets`, {
      description: `Formula has mismatched brackets.`
    });
    return false;
  }
  
  // Ensure there's at least one instrument
  if (!hasInstrument) {
    toast.error(`Missing instrument`, {
      description: `Formula must include at least one price instrument.`
    });
    return false;
  }
  
  return true;
};
