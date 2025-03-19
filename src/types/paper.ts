
import { BuySell, Product } from './trade';
import { Instrument } from './common';
import { ParentTrade } from './common';
import { PricingFormula } from './pricing';

// Paper trade product types
export type PaperProductCategory = 'FP' | 'DIFF' | 'SPREAD';

export interface PaperTradeProduct {
  id: string;
  productCode: string;
  displayName: string;
  category: PaperProductCategory;
  baseProduct: string | null;
  pairedProduct: string | null;
}

// Trading period
export type PeriodType = 'MONTH' | 'QUARTER';

export interface TradingPeriod {
  id: string;
  periodCode: string;
  periodType: PeriodType;
  startDate: Date;
  endDate: Date;
}

// Paper parent trade
export interface PaperParentTrade extends ParentTrade {
  tradeType: "paper";
  comment: string;
}

// Paper trade leg
export interface PaperTradeLeg {
  id: string;
  legReference: string;
  parentTradeId: string;
  buySell: BuySell;
  product: string;
  instrument: string;
  tradingPeriod: string;
  periodStart?: Date;
  periodEnd?: Date;
  price: number;
  quantity: number;
  broker: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

// Complete paper trade (for backward compatibility)
export interface PaperTrade extends ParentTrade {
  tradeType: "paper";
  comment: string;
  buySell?: BuySell;
  product?: string;
  instrument?: string;
  tradingPeriod?: string;
  pricingPeriodStart?: Date;
  pricingPeriodEnd?: Date;
  price?: number;
  quantity?: number;
  broker?: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  legs?: PaperTradeLeg[];
}
