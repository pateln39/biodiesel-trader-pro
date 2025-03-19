
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
  buySell: BuySell;
  product: Product;
  broker: string;
  instrument: string;
  price: number;
  quantity: number;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  formula: any;
  mtmFormula: any;
  legs: PaperTradeLeg[];
}

export interface PaperTradeLeg {
  id: string;
  parentTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  instrument: string;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
  formula: any;
  mtmFormula: any;
}
