
// Common type definitions used across the application
export type OperatorType = '+' | '-' | '*' | '/';
export type Instrument = 
  'Argus UCOME' | 
  'Argus RME' | 
  'Argus FAME0' | 
  'Argus HVO' | 
  'Platts LSGO' | 
  'Platts Diesel' | 
  'ICE GASOIL FUTURES';

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
  tradeId: string;
  movementReference: string;
  status: string;
  nominatedDate: Date;
  quantity: number;
}

export interface AuditLog {
  id: string;
  recordId: string;
  tableName: string;
  operation: string;
  timestamp: Date;
  userId: string;
}

// Re-export needed types to make them available from @/types
export * from './pricing';
export * from './physical';
