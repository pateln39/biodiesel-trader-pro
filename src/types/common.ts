
// Common types used across multiple domains

// String literal type for different instruments
export type Instrument = 
  'Argus UCOME' | 
  'Argus RME' | 
  'Argus FAME0' | 
  'Platts LSGO' | 
  'Platts Diesel' | 
  'Argus HVO' | 
  'ICE GASOIL FUTURES';

// Transaction direction type
export type Direction = 'buy' | 'sell';

// Define common numeric types with precision for specific domains
export type Quantity = number;
export type Price = number;
export type Amount = number;

// Base Trade interface
export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: 'physical' | 'paper';
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base Parent Trade interface
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: string;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database types for Supabase
export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  counterparty: string;
  physical_type?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
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
  pricing_formula?: any;
  mtm_formula?: any;
  created_at: string;
  updated_at: string;
}

// Movement and Audit interfaces
export interface Movement {
  id: string;
  movementReference: string;
  tradeLegId: string;
  nominatedDate?: Date;
  nominationValidDate?: Date;
  status: string;
  vesselName?: string;
  loadport?: string;
  disport?: string;
  blDate?: Date;
  blQuantity?: number;
  actualized: boolean;
  actualizedDate?: Date;
  actualizedQuantity?: number;
  cashFlowDate?: Date;
  inspector?: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  recordId: string;
  tableName: string;
  operation: string;
  userId?: string;
  timestamp: Date;
  oldData?: any;
  newData?: any;
}
