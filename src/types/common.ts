
export type Instrument = string;
export type OperatorType = "+" | "-" | "*" | "/" | "%" | "()";

export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type: string | null;
  counterparty: string;
  created_at: string;
  updated_at: string;
}

export interface DbTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  sustainability: string | null;
  inco_term: string | null;
  quantity: number;
  tolerance: number | null;
  loading_period_start: string | null;
  loading_period_end: string | null;
  pricing_period_start: string | null;
  pricing_period_end: string | null;
  unit: string | null;
  payment_term: string | null;
  credit_status: string | null;
  pricing_formula: any | null;
  created_at: string;
  updated_at: string;
  broker?: string;
  instrument?: string;
  price?: number;
  comment?: string | null;
  mtm_formula?: any | null;
}

// Base trade interface (parent trade)
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: import('./index').TradeType;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// For backward compatibility
export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: import('./index').TradeType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movement {
  id: string;
  tradeId: string;
  legId?: string;
  scheduledQuantity: number;
  nominatedDate?: Date;
  vesselName?: string;
  loadport?: string;
  inspector?: string;
  blDate?: Date;
  actualQuantity?: number;
  status: "scheduled" | "in-progress" | "completed";
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  entityType: "trade" | "movement";
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
  userId: string;
}

export interface ExposureReportItem {
  month: string;
  grade: string;
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}
