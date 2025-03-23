
import { toast } from 'sonner';

/**
 * Validate that a date range is valid (start <= end)
 */
export const validateDateRange = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  fieldName: string
): boolean => {
  if (!startDate || !endDate) {
    toast.error(`${fieldName} dates required`, {
      description: `Please set both start and end dates for ${fieldName}.`
    });
    return false;
  }

  if (startDate > endDate) {
    toast.error(`Invalid ${fieldName} date range`, {
      description: `${fieldName} start date must be before end date.`
    });
    return false;
  }

  return true;
};

/**
 * Validate that a required field has a value
 */
export const validateRequiredField = (
  value: any,
  fieldName: string
): boolean => {
  // Check various empty values
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    toast.error(`${fieldName} required`, {
      description: `Please enter a value for ${fieldName}.`
    });
    return false;
  }

  return true;
};

/**
 * Validate multiple fields and return combined result
 */
export const validateFields = (
  validations: boolean[]
): boolean => {
  return validations.every(isValid => isValid);
};

/**
 * Validate an email address
 */
export const validateEmail = (
  email: string,
  fieldName: string = 'Email'
): boolean => {
  if (!email) {
    toast.error(`${fieldName} required`, {
      description: `Please enter an email address.`
    });
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error(`Invalid ${fieldName}`, {
      description: `Please enter a valid email address.`
    });
    return false;
  }

  return true;
};
