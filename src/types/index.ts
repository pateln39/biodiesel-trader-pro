
// Export from type modules
export * from './pricing';
export * from './physical';
export * from './paper';
export * from './common';

// Add or update the Movement interface
export interface Movement {
  id: string;
  referenceNumber?: string;
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference?: string;
  counterpartyName?: string;
  product?: string;
  buySell?: string;
  incoTerm?: string;
  sustainability?: string;
  scheduledQuantity?: number;
  blQuantity?: number;
  actualQuantity?: number;
  nominationEta?: Date;
  nominationValid?: Date;
  cashFlow?: Date; // Changed from string to Date
  bargeName?: string;
  loadport?: string;
  loadportInspector?: string;
  disport?: string;
  disportInspector?: string;
  blDate?: Date;
  codDate?: Date;
  pricingType?: string;
  pricingFormula?: any;
  comments?: string;
  customsStatus?: string;
  creditStatus?: string;
  contractStatus?: string;
  status: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
