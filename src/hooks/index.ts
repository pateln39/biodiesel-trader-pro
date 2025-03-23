
// This file is kept for backward compatibility and re-exports all hooks from their module locations
// In the future, imports should come directly from the module hooks

// Re-export from core hooks
export { useIsMobile } from '@/core/hooks/use-mobile';
export { useToast, toast } from '@/core/hooks/use-toast';

// Re-export from trade module
export { useTrades } from '@/modules/trade/hooks/useTrades';
export { usePaperTrades } from '@/modules/trade/hooks/usePaperTrades';

// Re-export from pricing module
export { useHistoricalPrices } from '@/modules/pricing/hooks/useHistoricalPrices';

// Re-export from reference data
export { useReferenceData } from '@/core/hooks/useReferenceData';
