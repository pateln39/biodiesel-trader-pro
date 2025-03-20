
import { TradeType } from './index';

export type BuySell = "buy" | "sell";
export type Product = "FAME0" | "RME" | "UCOME" | "UCOME-5" | "RME DC";
export type DisplayProduct = string; // For displaying formatted product names
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA";
export type Unit = "MT" | "KG" | "L";
export type CreditStatus = "approved" | "pending" | "rejected";
export type PaymentTerm = "advance" | "30 days" | "60 days" | "90 days";
export type PaperRelationshipType = "FP" | "DIFF" | "SPREAD";

// Paper trade interface
export interface PaperTrade {
  id: string;
  tradeReference: string;
  tradeType: 'paper';
  createdAt: Date;
  updatedAt: Date;
  counterparty: string;
  comment?: string;
  broker: string;
  legs: PaperTradeLeg[];
}

export interface PaperTradeLeg {
  id: string;
  parentTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  quantity: number;
  period: string;
  price: number;
  broker: string;
  relationshipType: PaperRelationshipType;
  instrument?: string; // Store the full product name with type (e.g., "UCOME DIFF")
  rightSide?: {
    product: string;
    quantity: number;
    period: string;
    price: number;
  };
  formula: any;
  mtmFormula: any;
}

// Paper trade table row interface for the UI
export interface PaperTradeTableRow {
  id: string;
  product: string;
  buySell: BuySell;
  quantity: number;
  period: string;
  price: number;
  relationshipType: PaperRelationshipType;
  rightSide?: {
    product: string;
    quantity: number;
    period: string;
    price: number;
  };
  formula?: any;
  mtmFormula?: any;
}

// Product relationship interface for the UI
export interface ProductRelationship {
  id: string;
  product: string;
  relationship_type: PaperRelationshipType;
  paired_product: string | null;
  default_opposite: string | null;
  created_at?: string;
}
