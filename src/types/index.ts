
// This file is kept for backward compatibility and re-exports all types from their new module locations
// In the future, imports should come directly from the module types

// Re-export directly from the specific modules to avoid ambiguity
export * from '@/core/types';

// Export specific types from modules with explicit naming to avoid ambiguity
export { 
  TradeType, 
  BuySell, 
  PhysicalType, 
  Unit, 
  PaymentTerm, 
  CreditStatus, 
  IncoTerm,
  Product
} from '@/modules/trade/types/common';

export type { 
  DbParentTrade, 
  DbTradeLeg, 
  Trade
} from '@/core/types/common';

export { TokenType } from '@/core/types/common';

// Export exposure types
export type { ExposureResult } from '@/modules/exposure/types/exposure';
