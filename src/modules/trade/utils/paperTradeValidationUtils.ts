
/**
 * Utility functions for paper trade form validation
 */

import { toast } from "sonner";
import { PaperTradeLeg } from "@/modules/trade/types/paper";

/**
 * Validates that a required field has a value
 */
export const validateRequiredField = (
  value: string | number | undefined | null,
  fieldName: string
): boolean => {
  // Check for empty strings, undefined, null
  if (value === undefined || value === null || value === '') {
    toast.error(`${fieldName} required`, {
      description: `Please select or enter a value for ${fieldName}.`
    });
    return false;
  }
  
  // For number fields, verify they are valid numbers greater than zero
  if (typeof value === 'number' && isNaN(value)) {
    toast.error(`Invalid ${fieldName}`, {
      description: `${fieldName} must be a valid number.`
    });
    return false;
  }

  return true;
};

/**
 * Validates multiple fields at once and returns overall result
 */
export const validateFields = (validations: boolean[]): boolean => {
  return validations.every(isValid => isValid);
};

/**
 * Validates a complete paper trade leg
 */
export const validatePaperTradeLeg = (
  leg: Partial<PaperTradeLeg>,
  index: number
): boolean => {
  const legNumber = index + 1;
  
  // Common validations for all leg types
  const commonValidations = [
    validateRequiredField(leg.product, `Leg ${legNumber} - Product`),
    validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`),
    validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`),
    validateRequiredField(leg.period, `Leg ${legNumber} - Period`)
  ];

  // For spreads and diffs that have right side, validate right side as well
  // Update validation to only check the period if it exists on the rightSide object
  const rightSideValidations = leg.rightSide ? [
    validateRequiredField(leg.rightSide.product, `Leg ${legNumber} - Right Side Product`),
    leg.rightSide.period !== undefined ? validateRequiredField(leg.rightSide.period, `Leg ${legNumber} - Right Side Period`) : true
  ] : [];

  return validateFields([...commonValidations, ...rightSideValidations]);
};

/**
 * Validates a complete paper trade form
 */
export const validatePaperTradeForm = (
  broker: string,
  legs: Partial<PaperTradeLeg>[]
): boolean => {
  if (!validateRequiredField(broker, 'Broker')) {
    return false;
  }
  
  if (!legs || legs.length === 0) {
    toast.error('Trade legs required', {
      description: 'Please add at least one trade leg'
    });
    return false;
  }
  
  // Validate each leg
  const legValidations = legs.map((leg, index) => validatePaperTradeLeg(leg, index));
  
  return legValidations.every(isValid => isValid);
};
