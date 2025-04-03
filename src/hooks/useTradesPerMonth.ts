
import { useMemo } from 'react';
import { useTrades } from './useTrades';
import { PhysicalTrade } from '@/types';
import { formatMonthCode } from '@/utils/dateUtils';

export interface TradesPerMonthData {
  month: string;
  count: number;
  volume: number;
}

export const useTradesPerMonth = () => {
  const { trades, loading, error, refetchTrades } = useTrades();
  
  const tradesPerMonthData = useMemo(() => {
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
    const initialMonthData: TradesPerMonthData[] = months.map(month => ({
      month,
      count: 0,
      volume: 0
    }));
    
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
        
        // Add the quantity to the volume
        monthEntry.volume += leg.quantity;
      });
    });
    
    return initialMonthData;
  }, [trades]);
  
  return {
    tradesPerMonthData,
    loading,
    error,
    refetchTrades
  };
};
