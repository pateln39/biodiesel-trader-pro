
import { useEffect, useMemo } from 'react';
import { useTrades } from './useTrades';
import { PhysicalTrade } from '@/types';
import { formatMonthCode } from '@/utils/dateUtils';

export interface PhysicalPositionData {
  month: string;
  [productName: string]: string | number;
}

export const usePhysicalPositions = () => {
  const { trades, loading, error, refetchTrades } = useTrades();
  
  const physicalPositionData = useMemo(() => {
    // Get only physical trades
    const physicalTrades = trades.filter(
      (trade): trade is PhysicalTrade => trade.tradeType === 'physical'
    );
    
    // Get months: 2 before current month and 4 months into the future (total 7 months)
    const today = new Date();
    const months = [];
    
    // Add 2 months before current month
    for (let i = -2; i <= 4; i++) {
      const targetDate = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        1
      );
      months.push(formatMonthCode(targetDate));
    }
    
    // Initialize the monthly position data with months and zero values for each product
    const initialPositionData: PhysicalPositionData[] = months.map(month => {
      return {
        month,
        'UCOME': 0,
        'RME': 0,
        'FAME0': 0,
        'HVO': 0,
        'UCOME-5': 0,
        'RME DC': 0,
      };
    });
    
    // Process each trade and accumulate quantities by month and product
    physicalTrades.forEach(trade => {
      // Process each leg of the trade
      trade.legs.forEach(leg => {
        // Determine the month for this leg based on loading period start
        if (!leg.loadingPeriodStart) return;
        
        const monthCode = formatMonthCode(leg.loadingPeriodStart);
        
        // Find the month entry in our data array
        const monthEntry = initialPositionData.find(entry => entry.month === monthCode);
        if (!monthEntry) return;
        
        // Check if the product exists in our structure
        if (!(leg.product in monthEntry)) return;
        
        // Calculate the impact on position based on buy/sell direction
        const direction = leg.buySell === 'buy' ? 1 : -1;
        const quantity = leg.quantity * direction;
        
        // Add the quantity to the existing value
        monthEntry[leg.product] = (monthEntry[leg.product] as number) + quantity;
      });
    });
    
    return initialPositionData;
  }, [trades]);
  
  return {
    physicalPositionData,
    loading,
    error,
    refetchTrades
  };
};
