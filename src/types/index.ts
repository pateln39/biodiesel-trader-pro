
// This file is kept for backward compatibility and re-exports all types from their new module locations
// In the future, imports should come directly from the module types

// Re-export directly from the specific modules to avoid ambiguity
export * from '@/core/types';
export * from '@/modules/trade/types';
export * from '@/modules/exposure/types';
export * from '@/modules/operations/types';
export * from '@/modules/finance/types';

// Export specific enums with resolved names to avoid ambiguity
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
