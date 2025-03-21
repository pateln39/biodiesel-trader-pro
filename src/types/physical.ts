
import { BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus } from './trade';
import { PricingFormula } from './pricing';
import { ParentTrade, Trade } from './common';

export type PhysicalTradeType = "spot" | "term";

// Physical parent trade
export interface PhysicalParentTrade extends ParentTrade {
  tradeType: "physical";
  physicalType: PhysicalTradeType;
}

// Physical trade leg
export interface PhysicalTradeLeg {
  id: string;
  legReference: string;
  parentTradeId: string;
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

// For backward compatibility
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
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  legs: PhysicalTradeLeg[];
}
