
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
