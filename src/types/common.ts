
// Common type definitions used across the application
export type OperatorType = '+' | '-' | '*' | '/';
export type Instrument = 
  'Argus UCOME' | 
  'Argus RME' | 
  'Argus FAME0' | 
  'Argus HVO' | 
  'Platts LSGO' | 
  'Platts Diesel' | 
  'ICE GASOIL FUTURES' |
  'ICE GASOIL FUTURES (EFP)';

// Define TradeType here
export type TradeType = 'physical' | 'paper';

// Common types for trades
export type BuySell = 'buy' | 'sell';
// Updated Product type to be more flexible - now a string type instead of a union
export type Product = string;
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA";
export type Unit = "MT" | "KG" | "L";
export type CreditStatus = "approved" | "pending" | "rejected";
export type PaymentTerm = "advance" | "30 days" | "60 days" | "90 days";
export type CustomsStatus = "cleared" | "pending" | "rejected" | "T1" | "T2" | string;
export type PricingType = "standard" | "efp" | "fixed";
export type ContractStatus = "draft" | "signed" | "pending" | "cancelled" | "sent" | "in process" | "action needed" | "confirmed";

// Common base types for trades
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: TradeType;
  createdAt: Date;
  updatedAt: Date;
  counterparty: string;
}

export interface Trade extends ParentTrade {
  buySell: BuySell;
  product: string;
  legs: any[];
}

// Add database interface mappings that were missing
export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type?: string;
  counterparty: string;
  created_at: string;
  updated_at: string;
}

export interface DbTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  sustainability?: string;
  inco_term?: string;
  quantity: number;
  tolerance?: number;
  loading_period_start?: string;
  loading_period_end?: string;
  pricing_period_start?: string;
  pricing_period_end?: string;
  unit?: string;
  payment_term?: string;
  credit_status?: string;
  customs_status?: string;
  pricing_formula?: any;
  mtm_formula?: any;
  price?: number;
  calculated_price?: number;
  last_calculation_date?: string;
  created_at: string;
  updated_at: string;
  pricing_type?: string;
  efp_premium?: number;
  efp_agreed_status?: boolean;
  efp_fixed_value?: number;
  efp_designated_month?: string;
  mtm_future_month?: string;
  comments?: string;
  contract_status?: string;
}

// Enhanced Movement type with all the new fields
export interface Movement {
  id: string;
  referenceNumber?: string;
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference: string;
  counterpartyName: string;
  buySell?: BuySell;
  product: string;
  incoTerm?: string;
  sustainability?: string;
  scheduledQuantity?: number;
  blQuantity?: number;
  actualQuantity?: number;
  nominationEta?: Date;
  nominationValid?: Date;
  cashFlow?: string;
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
  type?: string; // Legacy field, can be removed if not needed
  quantity?: number; // Legacy field, can be removed if not needed
  createdAt: Date;
  updatedAt: Date;
  terminal_id?: string; // Added for terminal assignment
  inventory_movement_date?: Date; // Added for terminal assignment
}

export interface AuditLog {
  id: string;
  recordId: string;
  tableName: string;
  operation: string;
  timestamp: Date;
  userId: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string | null;
  newValue: string;
}

// Define ExposureResult for formulaUtils.ts
export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}
