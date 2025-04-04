
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
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA";
export type Unit = "MT" | "KG" | "L";
export type CreditStatus = "approved" | "pending" | "rejected";
export type PaymentTerm = "advance" | "30 days" | "60 days" | "90 days";

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

// Re-export needed types to make them available from @/types
export * from './pricing';
export * from './physical';
