
// Common types used across the application

// Instrument types
export type Instrument = 
  'Argus UCOME' | 
  'Argus RME' | 
  'Argus FAME0' | 
  'Platts LSGO' | 
  'Platts Diesel' |
  'Argus HVO' |
  'ICE GASOIL FUTURES' |
  'ICE GASOIL FUTURES (EFP)';

// Fixed component for pricing components
export interface FixedComponent {
  type: string;
  value: number;
  displayValue: string;
}

// Structure for exposure tracking
export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}

// Common parent trade interface
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: TradeType;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Trade types
export type TradeType = 'physical' | 'paper';

// Monthly distribution interface for pricing
export interface MonthlyDistribution {
  [month: string]: number;
}

// Movement interface
export interface Movement {
  id: string;
  tradeLegId: string;
  movementReference: string;
  nominatedDate?: Date;
  nominationValidDate?: Date;
  blDate?: Date;
  blQuantity?: number;
  actualized: boolean;
  actualizedQuantity?: number;
  status: string;
  vesselName?: string;
  loadport?: string;
  disport?: string;
  inspector?: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Audit log interface
export interface AuditLog {
  id: string;
  recordId: string;
  tableName: string;
  operation: string;
  oldData?: any;
  newData?: any;
  timestamp: Date;
  userId?: string;
}

// Export BuySell and Product types from trade.ts to avoid circular dependencies
export type { BuySell, Product } from './trade';
