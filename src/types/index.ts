
// Export from type modules
export * from './pricing';
export * from './physical';
export * from './common';
export * from './trade';

// Explicitly import and re-export from paper to avoid ambiguity
import { PaperParentTrade, PaperTradeRightSide } from './paper';
export type { PaperParentTrade, PaperTradeRightSide };

// Add or update the Movement interface
export interface Movement {
  id: string;
  referenceNumber?: string;
  reference_number?: string; // Adding snake_case version for compatibility
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference?: string;
  counterpartyName?: string;
  product?: string;
  buySell?: string;
  incoTerm?: string;
  sustainability?: string;
  quantity?: number; // Added this field to match the open trade's quantity
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
  pricingType?: PricingType;
  pricingFormula?: any;
  comments?: string;
  customsStatus?: string;
  creditStatus?: string;
  contractStatus?: string;
  status: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  // Adding the checklist properties
  bargeOrdersChecked?: boolean;
  nominationChecked?: boolean;
  loadPlanChecked?: boolean;
  coaReceivedChecked?: boolean;
  coaSentChecked?: boolean;
  eadChecked?: boolean;
  sort_order?: number; // Added sort_order property
  terminal_id?: string; // Added terminal_id property for terminal assignment
  inventory_movement_date?: Date; // Added inventory_movement_date for terminal assignments
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
import { FormulaToken } from './trade';

// Add missing export for MTMPriceDetail
export interface PriceDetail {
  date: string;
  price: number;
  instrument_id: string;
  instrument_code?: string;
}

export interface MTMPriceDetail extends PriceDetail {
  mtm_price: number;
  delta: number;
  mtm_date?: string;
}

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
  ExposureResult,
  FormulaToken
};
