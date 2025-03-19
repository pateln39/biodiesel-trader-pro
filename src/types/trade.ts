
import { TradeType } from './index';

export type BuySell = "buy" | "sell";
export type Product = "FAME0" | "RME" | "UCOME" | "UCOME-5" | "RME DC";
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA";
export type Unit = "MT" | "KG" | "L";
export type CreditStatus = "approved" | "pending" | "rejected";
export type PaymentTerm = "advance" | "30 days" | "60 days" | "90 days";

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
  relationshipType: 'FP' | 'DIFF' | 'SPREAD';
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
  relationshipType: 'FP' | 'DIFF' | 'SPREAD';
  rightSide?: {
    product: string;
    quantity: number;
    period: string;
    price: number;
  };
  formula?: any;
  mtmFormula?: any;
}
