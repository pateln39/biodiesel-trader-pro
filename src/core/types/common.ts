
/**
 * Common database interface types
 */

// Common enums shared across the application
export enum TokenType {
  Instrument = 'instrument',
  Operator = 'operator',
  Value = 'value', 
  Percentage = 'percentage',
  OpenBracket = 'open_bracket',
  CloseBracket = 'close_bracket',
  FixedValue = 'fixedValue'
}

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
  inco_term: string;
  quantity: number;
  tolerance: number;
  loading_period_start: string;
  loading_period_end: string;
  pricing_period_start: string;
  pricing_period_end: string;
  unit: string;
  payment_term: string;
  credit_status: string;
  formula: any;
  mtm_formula?: any;
  created_at: string;
  updated_at: string;
}

export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: string;
  physicalType?: string;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define MTM-related types for price calculations
export interface MTMPriceDetail {
  instruments: Record<string, {
    price: number;
    date: Date | null;
  }>;
  evaluatedPrice?: number;
  calculationDate?: Date;
  fixedComponents?: Array<{ value: number; displayValue: string }>;
}

export interface PriceDetail {
  instruments: Record<string, {
    prices: Array<{
      date: Date;
      price: number;
    }>;
    average: number;
  }>;
  calculationDate: Date;
}

// UI Types
export interface ProductRelationship {
  id: string;
  product: string;
  relationship_type: "FP" | "DIFF" | "SPREAD";
  paired_product: string | null;
  default_opposite: string | null;
  created_at?: string;
}

export type PaperRelationshipType = "FP" | "DIFF" | "SPREAD";
export type DisplayProduct = string;
export type Instrument = string;

// Date range interface
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Audit log interface for tracking changes
export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_data?: any;
  new_data?: any;
  timestamp: Date;
  user_id?: string;
}

// Price point interface for price charts
export interface PricePoint {
  date: Date;
  price: number;
}

// Price range interface for price filters
export interface PriceRange {
  min: number;
  max: number;
}

// Basic Trade interface for backward compatibility
export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: string;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // Allow additional properties
}

