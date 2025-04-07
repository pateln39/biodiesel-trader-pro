
export interface PaperTradeLeg {
  id: string;
  legReference: string;
  paperTradeId: string;
  buySell: 'buy' | 'sell';
  product: string;
  quantity: number;
  price?: number;
  formula?: any;
  mtmFormula?: any;
  exposures?: {
    physical?: Record<string, number>;
    pricing?: Record<string, number>;
  };
  period?: string;
  broker?: string;
  instrument?: string;
  relationshipType: 'FP' | 'DIFF' | 'SPREAD';
  rightSide?: {
    product: string;
    price?: number;
  };
  tradingPeriod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaperTrade {
  id: string;
  tradeReference: string;
  broker?: string;
  counterparty?: string;
  comment?: string;
  legs: PaperTradeLeg[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaperMTMPosition {
  legId: string;
  tradeRef: string;
  legReference: string;
  buySell: string;
  product: string;
  quantity: number;
  period: string;
  relationshipType: string;
  calculatedPrice: number;
  mtmCalculatedPrice: number;
  mtmValue: number;
  periodType: 'past' | 'current' | 'future';
  rightSide?: {
    product: string;
    price?: number;
  };
}
