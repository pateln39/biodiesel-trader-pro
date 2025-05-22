
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { PaginationParams, PaginationMeta } from '@/types/pagination';

export interface OpenTradeFilters {
  trade_reference?: string;
  buy_sell?: 'buy' | 'sell';
  product?: string;
  counterparty?: string;
  inco_term?: string;
  sustainability?: string;
  credit_status?: string;
  customs_status?: string;
  contract_status?: string;
  pricing_type?: string;
  status?: 'all' | 'in-process' | 'completed';
}

interface FilteredOpenTradesResponse {
  trades: OpenTrade[];
  pagination: PaginationMeta;
}

export const useFilteredOpenTrades = (
  filters: OpenTradeFilters = {},
  paginationParams: PaginationParams = { page: 1, pageSize: 15 },
  sortColumn: string = 'sort_order',
  sortDirection: 'asc' | 'desc' = 'asc'
) => {
  const [activeFilterCount, setActiveFilterCount] = useState<number>(0);

  // Count active filters (excluding 'status' if it's 'all')
  useEffect(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && (key !== 'status' || value !== 'all')) {
        count++;
      }
    });
    setActiveFilterCount(count);
  }, [filters]);

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['filteredOpenTrades', filters, paginationParams, sortColumn, sortDirection],
    queryFn: async () => {
      // Convert the filters object to a JSON object that can be passed to the RPC function
      const filtersParam = filters as Record<string, any>;

      const { data: responseData, error } = await supabase.rpc('filter_open_trades', {
        p_filters: filtersParam,
        p_page: paginationParams.page,
        p_page_size: paginationParams.pageSize,
        p_sort_column: sortColumn,
        p_sort_direction: sortDirection
      });

      if (error) {
        console.error('[FILTERED OPEN TRADES] Error:', error);
        throw error;
      }

      // Safely convert the JSON response to our expected type
      // First, cast to unknown, then to our interface type
      const typedResponse = responseData as unknown as FilteredOpenTradesResponse;
      
      // Validate the response structure to avoid runtime errors
      if (!typedResponse || !typedResponse.trades || !typedResponse.pagination) {
        console.error('[FILTERED OPEN TRADES] Invalid response format:', responseData);
        return { trades: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: paginationParams.pageSize } };
      }
      
      return typedResponse;
    },
  });

  return {
    openTrades: data?.trades || [],
    pagination: data?.pagination,
    loading: isLoading,
    error,
    refetchOpenTrades: refetch,
    activeFilterCount
  };
};
