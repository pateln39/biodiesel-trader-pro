
import { PricingFormula } from './pricing';
import { ParentTrade } from './common';

// Any new types related to physical trades here
export type PhysicalTradeType = 'spot' | 'term';
export type BuySell = 'buy' | 'sell';
// Updated to align with Product type from index.ts
export type Product = 'UCOME' | 'RME' | 'FAME0' | 'UCOME-5' | 'RME DC' | 'HVO' | string;
export type IncoTerm = 'FOB' | 'CIF' | 'DES' | 'DAP' | 'FCA';
export type Unit = 'MT' | 'KG' | 'L';
export type PaymentTerm = 'advance' | '30 days' | '60 days' | '90 days';
export type CreditStatus = 'pending' | 'approved' | 'rejected';
export type PricingType = 'standard' | 'efp';

export interface PhysicalTradeLeg {
  id: string;
  parentTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  sustainability?: string;
  incoTerm?: IncoTerm;
  quantity: number;
  tolerance?: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit?: Unit;
  paymentTerm?: PaymentTerm;
  creditStatus?: CreditStatus;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  pricingType?: PricingType;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
  mtmFutureMonth?: string; // Added new field for MTM future month selection
}

export interface PhysicalTrade extends ParentTrade {
  physicalType: PhysicalTradeType;
  buySell: BuySell;
  product: Product;
  sustainability?: string;
  incoTerm?: IncoTerm;
  quantity: number;
  tolerance?: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit?: Unit;
  paymentTerm?: PaymentTerm;
  creditStatus?: CreditStatus;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  pricingType?: PricingType;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
  mtmFutureMonth?: string; // Added new field for MTM future month selection
  legs: PhysicalTradeLeg[];
}
