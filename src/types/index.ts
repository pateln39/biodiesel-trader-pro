
export type TradeType = "physical" | "paper";
export type PhysicalTradeType = "spot" | "term";
export type BuySell = "buy" | "sell";
export type Product = "FAME0" | "RME" | "UCOME" | "UCOME-5" | "RME DC";
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA";
export type Unit = "MT" | "KG" | "L";
export type CreditStatus = "approved" | "pending" | "rejected";
export type PaymentTerm = "advance" | "30 days" | "60 days" | "90 days";
export type Instrument = string;
export type OperatorType = "+" | "-" | "*" | "/" | "%" | "()";

export interface FormulaNode {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "group";
  value: string;
  children?: FormulaNode[];
}

export interface FormulaToken {
  id: string;
  type: "instrument" | "fixedValue" | "operator";
  value: string;
}

export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: Record<Instrument, number>;
}

export interface PricingComponent {
  instrument: Instrument;
  percentage: number;
  adjustment: number;
}

// Database response types
export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type: string | null;
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
  sustainability: string | null;
  inco_term: string | null;
  quantity: number;
  tolerance: number | null;
  loading_period_start: string | null;
  loading_period_end: string | null;
  pricing_period_start: string | null;
  pricing_period_end: string | null;
  unit: string | null;
  payment_term: string | null;
  credit_status: string | null;
  pricing_formula: any | null;
  created_at: string;
  updated_at: string;
  broker?: string;
  instrument?: string;
  price?: number;
}

// Base trade interface (parent trade)
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: TradeType;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Physical parent trade
export interface PhysicalParentTrade extends ParentTrade {
  tradeType: "physical";
  physicalType: PhysicalTradeType;
}

// Paper parent trade
export interface PaperParentTrade extends ParentTrade {
  tradeType: "paper";
}

// Base trade leg interface
export interface TradeLeg {
  id: string;
  legReference: string;
  parentTradeId: string;
}

// Physical trade leg
export interface PhysicalTradeLeg extends TradeLeg {
  buySell: BuySell;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  pricingFormula: PricingComponent[];
  formula?: PricingFormula;
}

// Paper trade leg
export interface PaperTradeLeg extends TradeLeg {
  buySell: BuySell;
  product: Product;
  instrument: Instrument;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
}

// For backward compatibility
export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: TradeType;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhysicalTrade extends Trade {
  tradeType: "physical";
  physicalType: PhysicalTradeType;
  buySell: BuySell;
  counterparty: string;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  pricingFormula: PricingComponent[];
  formula?: PricingFormula;
  legs: PhysicalTradeLeg[];
}

export interface PaperTrade extends Trade {
  tradeType: "paper";
  instrument: Instrument;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
}

export interface Movement {
  id: string;
  tradeId: string;
  legId?: string;
  scheduledQuantity: number;
  nominatedDate?: Date;
  vesselName?: string;
  loadport?: string;
  inspector?: string;
  blDate?: Date;
  actualQuantity?: number;
  status: "scheduled" | "in-progress" | "completed";
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  entityType: "trade" | "movement";
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
  userId: string;
}

export interface ExposureReportItem {
  month: string;
  grade: string;
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}
