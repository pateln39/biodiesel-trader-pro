
// Export from type modules
export * from './pricing';
export * from './physical';
export * from './paper';
export * from './common';

// Explicit re-exports to avoid name conflicts when importing
import { PhysicalTrade } from './physical';
import { 
  Trade, 
  BuySell, 
  Product, 
  IncoTerm, 
  Unit, 
  PaymentTerm, 
  CreditStatus, 
  CustomsStatus,
  PricingType,
  ContractStatus,
  DbParentTrade,
  DbTradeLeg,
  TradeType,
  Instrument,
  ExposureResult
} from './common';
import { PricingFormula, PricingComponent } from './pricing';

// Re-export specific types explicitly to avoid ambiguities
export type {
  PhysicalTrade,
  Trade,
  TradeType,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  CustomsStatus,
  PricingType,
  ContractStatus,
  PricingFormula,
  PricingComponent,
  DbParentTrade,
  DbTradeLeg,
  Instrument,
  ExposureResult
};
