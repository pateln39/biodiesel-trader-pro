
import { BuySell, Product, Instrument, ParentTrade, Trade } from './common';
import { PricingFormula } from './pricing';

// Paper parent trade
export interface PaperParentTrade extends ParentTrade {
  tradeType: "paper";
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

// For backward compatibility
export interface PaperTrade extends Trade {
  tradeType: "paper";
  instrument: Instrument;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}
