
// Re-export core validation utilities
export {
  validateDateRange,
  validateRequiredField,
  validateFields
} from '@/core/utils/validationUtils';

// Additional validation utilities specific to trades
import { toast } from 'sonner';
import { TokenType } from '@/modules/trade/types/pricing';
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

/**
 * Validate a physical trade form before submission
 */
export const validatePhysicalTradeForm = (formData: any): boolean => {
  // Validate basic fields
  if (!formData.counterparty) {
    toast.error('Missing counterparty', {
      description: 'Please select a counterparty for this trade.'
    });
    return false;
  }
  
  // Validate legs
  if (!formData.legs || formData.legs.length === 0) {
    toast.error('No trade legs', {
      description: 'At least one trade leg is required.'
    });
    return false;
  }
  
  // For each leg, validate required fields
  for (let i = 0; i < formData.legs.length; i++) {
    const leg = formData.legs[i];
    const legNumber = i + 1;
    
    if (!leg.product) {
      toast.error(`Missing product in leg ${legNumber}`, {
        description: 'Please select a product for each trade leg.'
      });
      return false;
    }
    
    if (!leg.buySell) {
      toast.error(`Missing buy/sell in leg ${legNumber}`, {
        description: 'Please specify buy or sell for each trade leg.'
      });
      return false;
    }
    
    if (!leg.quantity || leg.quantity <= 0) {
      toast.error(`Invalid quantity in leg ${legNumber}`, {
        description: 'Please enter a valid positive quantity for each trade leg.'
      });
      return false;
    }
    
    // Validate dates
    if (leg.loadingPeriodStart && leg.loadingPeriodEnd) {
      if (new Date(leg.loadingPeriodStart) > new Date(leg.loadingPeriodEnd)) {
        toast.error(`Invalid loading period in leg ${legNumber}`, {
          description: 'Loading period end date must be after start date.'
        });
        return false;
      }
    } else {
      toast.error(`Missing loading period in leg ${legNumber}`, {
        description: 'Please specify both start and end dates for loading period.'
      });
      return false;
    }
    
    if (leg.pricingPeriodStart && leg.pricingPeriodEnd) {
      if (new Date(leg.pricingPeriodStart) > new Date(leg.pricingPeriodEnd)) {
        toast.error(`Invalid pricing period in leg ${legNumber}`, {
          description: 'Pricing period end date must be after start date.'
        });
        return false;
      }
    } else {
      toast.error(`Missing pricing period in leg ${legNumber}`, {
        description: 'Please specify both start and end dates for pricing period.'
      });
      return false;
    }
  }
  
  return true;
};
