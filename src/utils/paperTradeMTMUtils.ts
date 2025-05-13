
// This file has been refactored into smaller modules.
// Please use imports from @/utils/paperTrade instead.
// This file is kept for backwards compatibility and will be removed in a future update.

import { 
  calculatePaperTradePrice, 
  calculatePaperMTMPrice, 
  calculatePaperMTMValue,
  getMonthDates,
  getPeriodType,
  getInstrumentId,
  fetchMonthlyAveragePrice,
  fetchSpecificForwardPrice
} from './paperTrade';

// Re-export type definitions using 'export type'
export type { PaperMTMPosition } from './paperTrade';

// Re-export everything from the new modules to maintain backwards compatibility
export { 
  calculatePaperTradePrice, 
  calculatePaperMTMPrice, 
  calculatePaperMTMValue,
  getMonthDates,
  getPeriodType,
  getInstrumentId,
  fetchMonthlyAveragePrice,
  fetchSpecificForwardPrice
};

// This maintains the exact same API as the original file
