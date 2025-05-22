
import { useMemo } from 'react';
import { useDashboardAggregates } from './useDashboardAggregates';
import { useReferenceData } from '@/hooks/useReferenceData';

export interface PhysicalPositionData {
  month: string;
  [productName: string]: string | number;
}

export const usePhysicalPositions = () => {
  const { physicalPositionData, loading, error, refetchData } = useDashboardAggregates();
  const { isLoadingProducts } = useReferenceData();
  
  // This hook now uses the dashboard aggregates to provide the same interface as before
  // but with more efficient data fetching
  
  return {
    physicalPositionData,
    loading: loading || isLoadingProducts,
    error,
    refetchTrades: refetchData
  };
};
