
import { useMemo } from 'react';
import { useDashboardAggregates } from './useDashboardAggregates';
import { useReferenceData } from '@/hooks/useReferenceData';

export interface TradesPerMonthData {
  month: string;
  count: number;
  volume: number;
  [productVolume: string]: string | number; // For product-specific volumes if needed
}

export const useTradesPerMonth = () => {
  const { tradesPerMonthData, loading, error, refetchData } = useDashboardAggregates();
  const { productOptions, isLoadingProducts } = useReferenceData();
  
  // This hook now uses the dashboard aggregates to provide the same interface as before
  // but with more efficient data fetching
  
  return {
    tradesPerMonthData,
    loading: loading || isLoadingProducts,
    error,
    refetchTrades: refetchData
  };
};
