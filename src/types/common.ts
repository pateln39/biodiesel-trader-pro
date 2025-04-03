
// Common type definitions used across the application
export type OperatorType = '+' | '-' | '*' | '/';
export type Instrument = 
  'Argus UCOME' | 
  'Argus RME' | 
  'Argus FAME0' | 
  'Argus HVO' | 
  'Platts LSGO' | 
  'Platts Diesel' | 
  'ICE GASOIL FUTURES' |
  'ICE GASOIL FUTURES (EFP)';

// Common base types for trades
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: 'physical' | 'paper';
  createdAt: Date;
  updatedAt: Date;
  counterparty: string;
}

export interface Trade extends ParentTrade {
  buySell: 'buy' | 'sell';
  product: string;
  legs: any[];
}

// Movement and audit log types for data/mockData.ts
export interface Movement {
  id: string;
  tradeId: string; // Maps to trade_leg_id in Supabase
  movementReference: string;
  status: string;
  nominatedDate: Date;
  quantity: number;
  // Add new fields needed by OperationsPage
  legId?: string; // Maps to trade_leg_id in Supabase
  scheduledQuantity?: number; // Maps to bl_quantity in Supabase
  vesselName?: string;
  loadport?: string;
  disport?: string;
  // Additional fields from Supabase 
  actualized?: boolean;
  actualized_date?: string;
  actualized_quantity?: number;
  bl_date?: string;
  bl_quantity?: number;
  cash_flow_date?: string;
  comments?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  recordId: string;
  tableName: string;
  operation: string;
  timestamp: Date;
  userId: string;
  // Add fields needed by AuditLogPage
  entityType?: string;
  entityId?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

// Re-export needed types to make them available from @/types
export * from './pricing';
export * from './physical';
