
import { BuySell, Product } from './trade';
import { PricingFormula } from './pricing';

// Paper trade parent
export interface PaperParentTrade {
  id: string;
  tradeReference: string;
  tradeType: "paper";
  createdAt: Date;
  updatedAt: Date;
  counterparty: string;
  broker: string;
}

// Paper trade right side
export interface PaperTradeRightSide {
  product: Product;
  quantity: number;
  period?: string;
  price?: number;
}

// Paper trade leg
export interface PaperTradeLeg {
  id: string;
  paperTradeId: string;
  paper_trade_id?: string; // Added for compatibility
  legReference: string;
  leg_reference?: string; // Added for compatibility
  buySell: BuySell;
  buy_sell?: BuySell; // Added for compatibility
  product: string;
  quantity: number;
  period: string;
  price: number;
  broker: string;
  instrument: string;
  relationshipType: 'FP' | 'DIFF' | 'SPREAD';
  rightSide?: PaperTradeRightSide;
  // Using Record<string, any> for formula and mtmFormula to be compatible with JSON
  formula?: Record<string, any>;
  mtmFormula?: Record<string, any>;
  // Typed exposures field for better type safety
  exposures?: {
    physical?: Record<string, number>;
    pricing?: Record<string, number>;
    paper?: Record<string, number>;
  };
  created_at: Date; // Added for compatibility
  updated_at: Date; // Added for compatibility
}

// Complete paper trade with parent and legs
export interface PaperTrade {
  id: string;
  tradeReference: string;
  tradeType: "paper";
  broker: string;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
  buySell: BuySell;
  product: Product;
  legs: PaperTradeLeg[];
  created_at?: Date; // Added for compatibility
  updated_at?: Date; // Added for compatibility
}
