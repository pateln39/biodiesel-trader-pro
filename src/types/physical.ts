export type PhysicalTradeType = 'spot' | 'term';
export type BuySell = 'buy' | 'sell';
export type Product = 'FAME0' | 'RME' | 'UCOME' | 'UCOME-5' | 'RME DC' | 'HVO';
export type IncoTerm = 'FOB' | 'CIF' | 'DES' | 'DAP' | 'FCA';
export type Unit = 'MT' | 'KG' | 'L';
export type PaymentTerm = 'advance' | '30 days' | '60 days' | '90 days';
export type CreditStatus = 'pending' | 'approved' | 'rejected' | 'on hold';
export type PricingType = 'standard' | 'efp';

export interface PhysicalParentTrade {
  id: string;
  tradeReference: string;
  tradeType: 'physical';
  physicalType: PhysicalTradeType;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhysicalTradeLeg {
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
  pricingType: PricingType;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
}

export interface PhysicalTrade extends PhysicalParentTrade {
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
  legs: PhysicalTradeLeg[];
  pricingType?: PricingType;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
}

export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type: string;
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
  created_at: string;
  updated_at: string;
  pricing_type: PricingType;
  efp_premium?: number;
  efp_agreed_status?: boolean;
  efp_fixed_value?: number;
  efp_designated_month?: string;
}
