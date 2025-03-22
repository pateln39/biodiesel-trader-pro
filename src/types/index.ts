
// Re-export all types from new module locations
export * from '@/core/types';
export * from '@/modules/trade/types';
export * from '@/modules/exposure/types';
export * from '@/modules/operations/types';
export * from '@/modules/finance/types'; 

// Re-export TradeType directly to avoid circular dependency
export { TradeType } from '@/modules/trade/types';
