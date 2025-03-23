
/**
 * This file is kept for backward compatibility.
 * New code should import directly from the module-specific utility files.
 */

// Re-export dateUtils from core
export { getNextMonths, parseExcelDateSerial, formatDateString } from '@/core/utils/dateUtils';

// Re-export formulaUtils from pricing module
export {
  createEmptyFormula,
  validateAndParsePricingFormula,
  formulaToDisplayString,
  createInstrumentToken,
  createFixedValueToken,
  createOperatorToken,
  createPercentageToken,
  createOpenBracketToken, 
  createCloseBracketToken,
  formulaToString
} from '@/modules/pricing/utils/formulaUtils';

// Re-export tradeUtils from trade module
export {
  generateLegReference,
  generateTradeReference,
  formatQuantity,
  formatPrice,
  generateInstrumentName,
  formatProductDisplay,
  formatMTMDisplay
} from '@/modules/trade/utils/tradeUtils';

// Re-export validation utilities
export { validatePhysicalTradeForm } from '@/modules/trade/utils/physicalTradeValidationUtils';
export { validatePaperTradeForm } from '@/modules/trade/utils/paperTradeValidationUtils';

// Re-export delete utilities
export { deletePhysicalTrade } from '@/modules/trade/utils/physicalTradeDeleteUtils';
export { deletePaperTrade } from '@/modules/trade/utils/paperTradeDeleteUtils';

// Re-export subscription utilities
export { setupPhysicalTradeSubscriptions } from '@/modules/trade/utils/physicalTradeSubscriptionUtils';
export { setupPaperTradeSubscriptions } from '@/modules/trade/utils/paperTradeSubscriptionUtils';
