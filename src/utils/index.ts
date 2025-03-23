
// This file is kept for backward compatibility and re-exports all utilities from their new module locations
// In the future, imports should come directly from the module utilities

// Re-export core utils
export {
  formatDate,
  parseDate,
  getCurrentMonth,
  getPreviousMonth,
  getDateRange,
  getDateRangeForPeriod,
  isDateInRange,
  addMonths
} from '@/core/utils/dateUtils';

export {
  parseISODate,
  formatISODate,
  parseDateString
} from '@/core/utils/dateParsingUtils';

// Validation utils with explicit naming to avoid conflicts
export {
  validateFields as validateFieldSet,
  validateRequiredField as validateRequired,
  validateDateRange,
  validateNumberRange
} from '@/core/utils/validationUtils';

// Re-export trade utils
export * from '@/modules/trade/utils';

// Re-export operations utils
export * from '@/modules/operations/utils';

// Re-export pricing utils
export * from '@/modules/pricing/utils';
