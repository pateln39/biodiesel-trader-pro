
/**
 * Utility functions for paper trade form validation
 */
import { toast } from "sonner";

/**
 * Validates that a required field has a value
 */
export const validatePaperTradeField = (
  value: string | number | undefined | null,
  fieldName: string
): boolean => {
  // Check for empty strings, undefined, null values
  if (value === undefined || value === null || value === '') {
    toast.error(`${fieldName} required`, {
      description: `Please select or enter a value for ${fieldName}.`
    });
    return false;
  }
  
  if (typeof value === 'number' && value <= 0 && fieldName.includes('Quantity')) {
    toast.error(`Invalid ${fieldName}`, {
      description: `${fieldName} must be greater than zero.`
    });
    return false;
  }

  return true;
};

/**
 * Validates a form with multiple fields at once and returns overall result
 */
export const validatePaperTradeForm = (validations: boolean[]): boolean => {
  return validations.every(isValid => isValid);
};

/**
 * Validates a paper trade leg for required fields
 */
export const validatePaperTradeLeg = (
  leg: any,
  legNumber: number
): boolean => {
  const validations = [
    validatePaperTradeField(leg.buySell, `Leg ${legNumber} - Buy/Sell`),
    validatePaperTradeField(leg.product, `Leg ${legNumber} - Product`),
    validatePaperTradeField(leg.instrument, `Leg ${legNumber} - Instrument`),
    validatePaperTradeField(leg.quantity, `Leg ${legNumber} - Quantity`)
  ];
  
  return validatePaperTradeForm(validations);
};
