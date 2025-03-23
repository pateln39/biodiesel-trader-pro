
// This file is kept for backward compatibility and re-exports all types from their new module locations
// In the future, imports should come directly from the module types

// Re-export all types from new module locations
export * from '@/core/types';
export * from '@/modules/trade/types';
export * from '@/modules/exposure/types';
export * from '@/modules/operations/types';
export * from '@/modules/finance/types';

// Re-export specific types to avoid ambiguity
export { TradeType, BuySell, PhysicalType, Unit, PaymentTerm, CreditStatus, IncoTerm, Product } from '@/modules/trade/types/common';

// Re-export database interfaces from core
export { DbParentTrade, DbTradeLeg, ParentTrade } from '@/core/types/common';
