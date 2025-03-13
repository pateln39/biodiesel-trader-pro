
export type BuySell = 'buy' | 'sell';

export type Product = 'FAME0' | 'RME' | 'UCOME' | 'UCOME-5' | 'RME DC';

export type PhysicalTradeType = 'spot' | 'term';

export type IncoTerm = 'FOB' | 'CIF' | 'DES' | 'DAP' | 'FCA';

export type Unit = 'MT' | 'KG' | 'L';

export type PaymentTerm = 'advance' | '30 days' | '60 days' | '90 days';

export type CreditStatus = 'pending' | 'approved' | 'rejected';

export type TradeStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

export type Instrument = 'Argus UCOME' | 'Argus RME' | 'Argus FAME0' | 'Platts LSGO' | 'Platts diesel';

export type OperatorType = '+' | '-' | '*' | '/';

// Time periods for price data
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

// Base trade interface
export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: "physical" | "paper";
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base parent trade interface
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: "physical" | "paper";
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database types
export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type?: string;
  counterparty: string;
  created_at: string;
  updated_at: string;
}

export interface DbTradeLeg {
  id: string;
  leg_reference: string;
  parent_trade_id: string;
  buy_sell: string;
  product: string;
  sustainability?: string;
  inco_term?: string;
  quantity: number;
  tolerance?: number;
  loading_period_start?: string;
  loading_period_end?: string;
  pricing_period_start?: string;
  pricing_period_end?: string;
  unit?: string;
  payment_term?: string;
  credit_status?: string;
  price?: number;
  instrument?: string;
  broker?: string;
  pricing_formula?: any;
  mtm_formula?: any;
  created_at: string;
  updated_at: string;
}

// Additional types needed for the application
export interface Movement {
  id: string;
  tradeId: string;
  tradeReference: string;
  movementReference: string;
  movementType: string;
  status: string;
  quantity: number;
  dateScheduled: Date;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: Date;
}

export interface ExposureReportItem {
  instrument: Instrument;
  physical: number;
  paper: number;
  net: number;
}

export interface MTMPosition {
  id: string;
  tradeId: string;
  legId: string;
  tradeRef: string;
  buySell: string;
  product: Product;
  quantity: number;
  startDate: Date;
  endDate: Date;
  periodType: string;
  formula: any;
  mtmFormula: any;
  calculatedPrice: number;
  mtmCalculatedPrice: number;
  mtmValue: number;
}
