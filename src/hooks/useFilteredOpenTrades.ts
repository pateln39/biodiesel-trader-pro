
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

      const { data, error } = await supabase.rpc('filter_open_trades', {
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

      // Cast the data to the correct type
      return data as FilteredOpenTradesResponse;
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
