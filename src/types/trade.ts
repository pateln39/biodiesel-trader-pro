
// Import TradeType from common instead of index to avoid circular dependency
import { TradeType } from './common';

export type BuySell = "buy" | "sell";
export type Product = "FAME0" | "RME" | "UCOME" | "UCOME-5" | "RME DC" | "LSGO" | "HVO";
export type DisplayProduct = string; // For displaying formatted product names
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA";
export type Unit = "MT" | "KG" | "L";
export type CreditStatus = "approved" | "pending" | "rejected";
export type PaymentTerm = "advance" | "30 days" | "60 days" | "90 days";
export type PaperRelationshipType = "FP" | "DIFF" | "SPREAD";

// Product relationship interface for the UI
export interface ProductRelationship {
  id: string;
  product: string;
  relationship_type: PaperRelationshipType;
  paired_product: string | null;
  default_opposite: string | null;
  created_at?: string;
}

// Define PaperTrade interface
export interface PaperTrade {
  id: string;
  tradeReference: string;
  counterparty: string;
  created_at: Date;
  updated_at: Date;
  legs: PaperTradeLeg[];
}

// Define PaperTradeLeg interface
export interface PaperTradeLeg {
  id: string;
  paper_trade_id: string;
  leg_reference: string;
  legReference?: string; // For compatibility with existing code
  buy_sell: BuySell;
  buySell?: BuySell; // For compatibility with existing code
  product: string;
  quantity: number;
  period: string;
  relationshipType: PaperRelationshipType;
  rightSide?: {
    product: string;
    price?: number;
  };
  price?: number;
  calculatedPrice?: number;
  created_at: Date;
  updated_at: Date;
}

// Export FormulaToken and PricingFormula interfaces that were missing
export interface FormulaToken {
  type: 'operator' | 'number' | 'instrument' | 'fixed';
  value: string | number;
  display?: string;
}

export interface PricingFormula {
  tokens: FormulaToken[];
  formula: string;
}
