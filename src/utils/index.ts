
// This file is kept for backward compatibility and re-exports all utilities from their new module locations
// In the future, imports should come directly from the module utilities

// Re-export date utilities
export {
  getNextMonths,
  formatMonthCode,
  isValidFuturePeriod
} from '@/core/utils/dateUtils';

export {
  formatDateString,
  parseExcelDateSerial,
  parseISODate,
  formatISODate,
  parseDateString
} from '@/core/utils/dateParsingUtils';

// Validation utils with explicit naming to avoid conflicts
export {
  validateDateRange,
  validateRequiredField,
  validateFields
} from '@/core/utils/validationUtils';

// Re-export trade utils
export * from '@/modules/trade/utils';

// Re-export operations utils
export * from '@/modules/operations/utils';

// Re-export pricing utils
export * from '@/modules/pricing/utils';
