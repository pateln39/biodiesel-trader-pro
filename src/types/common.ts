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
export type Product = "FAME0" | "RME" | "UCOME" | "UCOME-5" | "RME DC" | "LSGO" | "HVO";
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA" | "CFR";
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
  comments?: string;
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

// Define FormulaToken and other missing types
export interface FormulaToken {
  type: string;
  value: string | number;
  instrument?: string;
  operator?: string;
}

export interface PricingFormula {
  tokens: FormulaToken[];
}

export interface PriceDetail {
  instruments?: Record<Instrument, {
    average: number;
    prices: { date: Date; price: number }[];
  }>;
  fixedComponents?: { displayValue: string; value: number }[];
  instrument?: string;
  date?: Date;
  price?: number;
}

export interface MTMPriceDetail {
  instruments?: Record<Instrument, {
    price: number;
    date: Date;
  }>;
  instrument?: string;
  month?: string;
  price?: number;
  fixedComponents?: { displayValue: string; value: number }[];
  evaluatedPrice?: number;
}

export interface MonthlyDistribution {
  month: string;
  percentage: number;
  [instrument: string]: number | string;
}

// Define ExposureResult for formulaUtils.ts
export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
  paper?: Record<Instrument, number>;
}

// Define OpenTrade interface for component compatibility
export interface OpenTrade {
  id: string;
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference: string;
  counterparty: string;
  buySell: BuySell;
  product: string;
  sustainability?: string;
  incoTerm?: IncoTerm;
  quantity: number;
  tolerance?: number;
  loadingPeriodStart?: Date;
  loadingPeriodEnd?: Date;
  pricingPeriodStart?: Date;
  pricingPeriodEnd?: Date;
  scheduledQuantity?: number;
  openQuantity?: number;
  unit?: Unit;
  paymentTerm?: PaymentTerm;
  creditStatus?: CreditStatus;
  customsStatus?: CustomsStatus;
  pricingFormula?: any;
  nominatedValue?: number;
  balance?: number;
  vesselName?: string;
  loadport?: string;
  disport?: string;
  status?: string;
  pricingType?: PricingType;
  comments?: string;
  contractStatus?: ContractStatus;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
  createdAt: Date;
  updatedAt: Date;
}
