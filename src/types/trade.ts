import { TradeType } from './index';

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
