
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PhysicalPositionData {
  month: string;
  [productName: string]: string | number;
}

export interface TradesPerMonthData {
  month: string;
  count: number;
  volume: number;
}

// Define TypeScript interfaces for the function return types
interface PhysicalPositionsPivoted {
  month: string;
  products: Record<string, number>;
}

export interface UseDashboardAggregatesResult {
  physicalPositionData: PhysicalPositionData[];
  tradesPerMonthData: TradesPerMonthData[];
  loading: boolean;
  error: Error | null;
  refetchData: () => void;
}

export const useDashboardAggregates = (): UseDashboardAggregatesResult => {
  const [physicalPositionData, setPhysicalPositionData] = useState<PhysicalPositionData[]>([]);
  const [tradesPerMonthData, setTradesPerMonthData] = useState<TradesPerMonthData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch physical positions with proper typing
      const { data: physicalPositions, error: physicalError } = await supabase
        .rpc('get_physical_positions_pivoted') as { 
          data: PhysicalPositionsPivoted[] | null, 
          error: Error | null 
        };
      
      if (physicalError) throw new Error(`Failed to fetch physical positions: ${physicalError.message}`);
      if (!physicalPositions) throw new Error('No physical position data returned');
      
      // Transform the result into the expected format
      const formattedPositions: PhysicalPositionData[] = physicalPositions.map(row => {
        const positionData: PhysicalPositionData = { month: row.month };
        
        // Add each product position from the JSON to the flat object
        if (row.products) {
          Object.entries(row.products).forEach(([product, value]) => {
            positionData[product] = value as number;
          });
        }
        
        return positionData;
      });
      
      // Fetch trades per month with proper typing
      const { data: tradesPerMonth, error: tradesError } = await supabase
        .rpc('get_trades_per_month') as {
          data: TradesPerMonthData[] | null,
          error: Error | null
        };
      
      if (tradesError) throw new Error(`Failed to fetch trades per month: ${tradesError.message}`);
      
      setPhysicalPositionData(formattedPositions);
      setTradesPerMonthData(tradesPerMonth || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetchData = () => {
    fetchData();
  };

  return {
    physicalPositionData,
    tradesPerMonthData,
    loading,
    error,
    refetchData
  };
};
