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
  fetchSpecificForwardPrice,
  PaperMTMPosition
} from './paperTrade';

// Re-export everything from the new modules to maintain backwards compatibility
export { 
  calculatePaperTradePrice, 
  calculatePaperMTMPrice, 
  calculatePaperMTMValue,
  getMonthDates,
  getPeriodType,
  getInstrumentId,
  fetchMonthlyAveragePrice,
  fetchSpecificForwardPrice,
  PaperMTMPosition
};

// This maintains the exact same API as the original file
