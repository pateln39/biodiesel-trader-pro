
import { ParentTrade, Trade } from "./common";

// Physical trade types
export type BuySell = "buy" | "sell";
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP";
export type Unit = "MT" | "BBL" | "GAL";
export type PaymentTerm = "30 days" | "45 days" | "60 days" | "immediate";
export type CreditStatus = "pending" | "approved" | "rejected";
export type Product = 
  | "UCOME" 
  | "FAME0" 
  | "RME" 
  | "HVO" 
  | "LSGO"
  | "UCOME DIFF" 
  | "RME DIFF" 
  | "FAME0 DIFF"
  | "RME-FAME"
  | "UCOME-FAME"
  | "UCOME-RME"
  | "UCOME FP"
  | "RME FP"
  | "FAME0 FP";

export type DisplayProduct = Product | string;

// Paper trade specific types
export type PaperRelationshipType = "FP" | "DIFF" | "SPREAD";

// Common formula types
export interface FormulaToken {
  type: "number" | "operator" | "variable" | "function";
  value: string | number;
}

export interface FormulaConfig {
  tokens: FormulaToken[];
}

// Physical trade leg definition
export interface PhysicalTradeLeg {
  id: string;
  parentTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  sustainability?: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance?: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  formula: FormulaConfig;
  mtmFormula: FormulaConfig;
}

// Physical trade definition
export interface PhysicalTrade extends Trade {
  physicalType: 'spot' | 'term';
  counterparty: string;
  buySell: BuySell;
  product: Product;
  sustainability?: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance?: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  formula: FormulaConfig;
  mtmFormula: FormulaConfig;
  legs?: PhysicalTradeLeg[];
}

// Paper trade right side definition (for DIFF and SPREAD)
export interface PaperTradeRightSide {
  product: string;
  quantity: number;
  period?: string;
  price?: number;
}

// Paper trade leg definition
export interface PaperTradeLeg {
  id: string;
  parentTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  quantity: number;
  period: string;
  price: number;
  broker?: string;
  relationshipType: PaperRelationshipType;
  instrument?: string;
  rightSide?: PaperTradeRightSide; 
  formula?: any;
  mtmFormula?: any;
}

// Paper trade definition
export interface PaperTrade extends ParentTrade {
  comment?: string;
  broker: string;
  legs: PaperTradeLeg[];
}
