
import { BuySell, Product } from './trade';
import { Instrument } from './common';
import { ParentTrade } from './common';
import { PricingFormula } from './pricing';

// Paper parent trade
export interface PaperParentTrade extends ParentTrade {
  tradeType: "paper";
  comment?: string;
}

// Paper trade leg
export interface PaperTradeLeg {
  id: string;
  legReference: string;
  parentTradeId: string;
  buySell: BuySell;
  product: Product;
  instrument: Instrument;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

export interface PaperTradeRow {
  id: string;
  legA: PaperTradeLeg | null;
  legB: PaperTradeLeg | null;
  mtmFormula?: PricingFormula;
}

// For backward compatibility
export interface PaperTrade extends ParentTrade {
  tradeType: "paper";
  comment?: string;
  buySell: BuySell;
  product: Product;
  instrument: Instrument;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  legs?: PaperTradeLeg[];
  rows?: PaperTradeRow[];
}
