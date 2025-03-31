export type TradeType = 'physical' | 'paper';
export type BuySell = 'buy' | 'sell';
export type Product = 'UCOME' | 'FAME0' | 'RME' | 'UCOME-5' | 'RME DC' | 'HVO';
export type IncoTerm = 'CIF' | 'FOB' | 'DES' | 'DAP' | 'FCA';
export type Unit = 'MT' | 'KG' | 'L';
export type PaymentTerm = 'advance' | '30 days' | '60 days' | '90 days';
export type CreditStatus = 'approved' | 'pending' | 'rejected';
export type PhysicalTradeType = 'spot' | 'term';

export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: TradeType;
  createdAt: Date;
  updatedAt: Date;
  counterparty: string;
  buySell: BuySell;
  product: Product;
  legs: TradeLeg[];
}

export interface PhysicalTrade extends Trade {
  tradeType: 'physical';
  physicalType: PhysicalTradeType;
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
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  legs: PhysicalTradeLeg[];
}

export interface PaperTrade extends Trade {
  tradeType: 'paper';
  legs: PaperTradeLeg[];
}

export interface TradeLeg {
  id: string;
  parentTradeId: string;
  legReference: string;
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
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

export interface PhysicalTradeLeg extends TradeLeg {
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
  pricingType: "standard" | "efp";
}

export interface PaperTradeLeg extends TradeLeg {
  period: string;
}

export interface PricingFormula {
  tokens: FormulaToken[];
  result?: number;
  monthlyDistribution?: { month: string; quantity: number }[];
}

export interface FormulaToken {
  type: 'instrument' | 'operator' | 'number' | 'function' | 'argument';
  value: string;
}

// Database types
export type DbParentTrade = {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type: string;
  counterparty: string;
  created_at: string;
  updated_at: string;
};

export type DbTradeLeg = {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  sustainability: string;
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
  pricing_formula: any;
  mtm_formula: any;
  efp_premium: number;
  efp_agreed_status: boolean;
  efp_fixed_value: number;
  efp_designated_month: string;
  pricing_type: "standard" | "efp";
};
