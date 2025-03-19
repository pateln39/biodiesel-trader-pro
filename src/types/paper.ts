
import { BuySell, Product } from './trade';
import { Instrument } from './common';
import { ParentTrade } from './common';
import { PricingFormula } from './pricing';

// Paper parent trade
export interface PaperParentTrade extends ParentTrade {
  tradeType: "paper";
  comment?: string;
  broker: string;
}

// Paper trade position side (previously called PaperTradeLeg)
export interface PaperTradePositionSide {
  id: string;
  sideReference: string;
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

// Trade row with left side, optional right side, and MTM formula
export interface PaperTradeRow {
  id: string;
  leftSide: PaperTradePositionSide | null;
  rightSide: PaperTradePositionSide | null;
  mtmFormula?: PricingFormula;
}

// Complete paper trade with rows structure
export interface PaperTrade extends PaperParentTrade {
  rows: PaperTradeRow[];
  // The following fields are for backward compatibility
  buySell?: BuySell;
  product?: Product;
  instrument?: Instrument;
  pricingPeriodStart?: Date;
  pricingPeriodEnd?: Date;
  price?: number;
  quantity?: number;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  legs?: PaperTradePositionSide[];
}

// Exposure entry for the exposure table
export interface PaperExposure {
  month: string;
  products: Record<string, number>;
}
