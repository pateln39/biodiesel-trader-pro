
// Export from type modules
export * from './pricing';
export * from './physical';
export * from './paper';

// Define and export TradeType which is missing
export type TradeType = 'physical' | 'paper';

// Re-export specific types to avoid ambiguities
import { PhysicalTrade } from './physical';
import { Trade, BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus } from './common';
import { PricingFormula } from './pricing';

export type {
  PhysicalTrade,
  Trade,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  PricingFormula
};
