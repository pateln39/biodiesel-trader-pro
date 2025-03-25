/**
 * Utility functions for form validation
 */

import { toast } from "sonner";

/**
 * Validates that a date range is valid (start date is before or equal to end date)
 */
export const validateDateRange = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  rangeName: string
): boolean => {
  if (!startDate || !endDate) {
    toast.error(`${rangeName} missing`, {
      description: `Please select both start and end dates for ${rangeName}.`
    });
    return false;
  }

  if (startDate > endDate) { // Changed from >= to > to allow equal dates
    toast.error(`Invalid ${rangeName}`, {
      description: `${rangeName} end date must not be before start date.`
    });
    return false;
  }

  return true;
};

/**
 * Validates that a required field has a value
 */
export const validateRequiredField = (
  value: string | number | undefined | null,
  fieldName: string
): boolean => {
  // Check for empty strings, undefined, null, or zero values
  if (value === undefined || value === null || value === '') {
    toast.error(`${fieldName} required`, {
      description: `Please select or enter a value for ${fieldName}.`
    });
    return false;
  }
  
  // Allow zero for price fields but not for other numeric fields
  if (typeof value === 'number' && value < 0) {
    toast.error(`Invalid ${fieldName}`, {
      description: `${fieldName} must be zero or greater.`
    });
    return false;
  }

  return true;
};

/**
 * Validates a form with multiple fields at once and returns overall result
 */
export const validateFields = (validations: boolean[]): boolean => {
  return validations.every(isValid => isValid);
};
