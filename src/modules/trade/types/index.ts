
// Export all trade module types
export * from './common';
export * from './physical';
export * from './paper';
export * from './pricing';

// Import and re-export unified trade type
import { PaperTrade } from './paper';
import { PhysicalTrade } from './physical';

// Explicitly re-export to avoid ambiguity
export type { PhysicalTrade, PaperTrade };

// Unified trade type that can be either physical or paper
export type Trade = PhysicalTrade | PaperTrade;

// Explicitly re-export specific types to avoid ambiguity
export { 
  TradeType,
  BuySell,
  PhysicalType,
  Unit,
  PaymentTerm,
  CreditStatus,
  IncoTerm,
  Product as CommonProduct,
  TokenType as CommonTokenType
} from './common';

export {
  Product as PhysicalProduct,
  IncoTerm as PhysicalIncoTerm,
  PaymentTerm as PhysicalPaymentTerm,
  CreditStatus as PhysicalCreditStatus
} from './physical';

export {
  TokenType as PricingTokenType
} from './pricing';
