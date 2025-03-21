
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
  // Using Record<string, any> for formula and mtmFormula to be compatible with JSON
  formula?: Record<string, any>;
  mtmFormula?: Record<string, any>;
  // Typed exposures field separate from mtm_formula
  exposures?: {
    physical?: Record<string, number>;
    pricing?: Record<string, number>;
    paper?: Record<string, number>;
  };
}

// Complete paper trade with parent and legs
export interface PaperTrade extends Trade {
  tradeType: "paper";
  broker: string;
  legs: PaperTradeLeg[];
  comment?: string;
  // Added to track if a trade is using the legacy schema or new schema
  legacy?: boolean;
}
