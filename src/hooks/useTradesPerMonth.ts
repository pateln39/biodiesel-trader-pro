
import { useMemo } from 'react';
import { useTrades } from './useTrades';
import { PhysicalTrade } from '@/types';
import { formatMonthCode } from '@/utils/dateUtils';
import { useReferenceData } from '@/hooks/useReferenceData';

export interface TradesPerMonthData {
  month: string;
  count: number;
  volume: number;
  [productVolume: string]: string | number; // For product-specific volumes if needed
}

export const useTradesPerMonth = () => {
  const { trades, loading, error, refetchTrades } = useTrades();
  const { productOptions, isLoadingProducts } = useReferenceData();
  
  const tradesPerMonthData = useMemo(() => {
    // If products are still loading, return empty array
    if (isLoadingProducts) {
      return [];
    }
    
    // Filter to get only physical trades
    const physicalTrades = trades.filter(
      (trade): trade is PhysicalTrade => trade.tradeType === 'physical'
    );
    
    // Get months: 2 before current month and 4 months into the future (total 7 months)
    // This matches the month range used in the Physical Position table
    const today = new Date();
    const months = [];
    
    for (let i = -2; i <= 4; i++) {
      const targetDate = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        1
      );
      months.push(formatMonthCode(targetDate));
    }
    
    // Initialize data structure with months and zero values
    const initialMonthData: TradesPerMonthData[] = months.map(month => {
      const monthData: TradesPerMonthData = {
        month,
        count: 0,
        volume: 0
      };
      
      // Add product-specific volume tracking if needed
      productOptions.forEach(product => {
        monthData[`${product}_volume`] = 0;
      });
      
      return monthData;
    });
    
    // Group trades by month and calculate metrics
    physicalTrades.forEach(trade => {
      // Process each leg of the trade to get the loading period months
      trade.legs.forEach(leg => {
        if (!leg.loadingPeriodStart) return;
        
        const monthCode = formatMonthCode(leg.loadingPeriodStart);
        
        // Find matching month entry
        const monthEntry = initialMonthData.find(entry => entry.month === monthCode);
        if (!monthEntry) return;
        
        // Increment trade count (only once per leg)
        monthEntry.count++;
        
        // Add the quantity to the total volume
        monthEntry.volume += leg.quantity;
        
        // Track product-specific volumes if needed
        const productVolumeKey = `${leg.product}_volume`;
        if (productVolumeKey in monthEntry) {
          monthEntry[productVolumeKey] = (monthEntry[productVolumeKey] as number) + leg.quantity;
        }
      });
    });
    
    return initialMonthData;
  }, [trades, productOptions, isLoadingProducts]);
  
  return {
    tradesPerMonthData,
    loading: loading || isLoadingProducts,
    error,
    refetchTrades
  };
};
