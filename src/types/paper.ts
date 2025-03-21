
import { BuySell, Product } from './trade';
import { PricingFormula } from './pricing';
import { ParentTrade, Trade } from './common';

export type PaperRelationshipType = 'FP' | 'DIFF' | 'SPREAD';

// Paper trade parent
export interface PaperParentTrade extends ParentTrade {
  tradeType: "paper";
  broker: string;
}

// Paper trade leg
export interface PaperTradeLeg {
  id: string;
  paperTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  quantity: number;
  period: string;
  price: number;
  broker: string;
  instrument: string;
  relationshipType: PaperRelationshipType;
  rightSide?: {
    product: Product;
    quantity: number;
  };
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

// Complete paper trade with parent and legs
export interface PaperTrade extends Trade {
  tradeType: "paper";
  broker: string;
  legs: PaperTradeLeg[];
}
