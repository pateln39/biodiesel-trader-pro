import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { PaginationParams, PaginationMeta } from '@/types/pagination';
import { SortConfig } from '@/hooks/useMovementDateSort';

export interface OpenTradeFilters {
  trade_reference?: string;
  buy_sell?: 'buy' | 'sell';
  product?: string | string[];
  counterparty?: string | string[];
  inco_term?: string | string[];
  sustainability?: string | string[];
  credit_status?: string | string[];
  customs_status?: string | string[];
  contract_status?: string | string[];
  pricing_type?: string;
  status?: 'all' | 'in-process' | 'completed';
  loading_period_start_from?: string;
  loading_period_start_to?: string;
  loading_period_end_from?: string;
  loading_period_end_to?: string;
}

interface FilteredOpenTradesResponse {
  trades: OpenTrade[];
  pagination: PaginationMeta;
}

export const useFilteredOpenTrades = (
  filters: OpenTradeFilters = {},
  paginationParams: PaginationParams = { page: 1, pageSize: 15 },
  sortConfig: SortConfig[] = []
) => {
  const [activeFilterCount, setActiveFilterCount] = useState<number>(0);
  const [noResultsFound, setNoResultsFound] = useState<boolean>(false);
  
  // Default sort to sort_order asc if no custom sort is provided
  const sortColumn = sortConfig.length > 0 ? sortConfig[0].column : 'sort_order';
  const sortDirection = sortConfig.length > 0 ? sortConfig[0].direction : 'asc';

  // Count active filters (excluding 'status' if it's 'all')
  useEffect(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === 'status' && value === 'all') {
          // Don't count 'all' status as a filter
          return;
        }
        
        if (Array.isArray(value)) {
          // For array values, count each non-empty array as one filter
          if (value.length > 0) {
            count++;
          }
        } else {
          count++;
        }
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
    queryKey: ['filteredOpenTrades', filters, paginationParams, sortConfig],
    queryFn: async () => {
      // Convert the filters object to a JSON object that can be passed to the RPC function
      // Handle arrays properly for the multi-select filters
      const filtersParam: Record<string, any> = {};
      
      // Process each filter
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          filtersParam[key] = value;
        }
      });

      // Check if we should use the multi-column sort (new) or single-column sort (old)
      let response;
      
      if (sortConfig.length > 0) {
        // Convert sort columns for the API
        const sortParams = sortConfig.map(sc => ({ column: sc.column, direction: sc.direction }));
        
        // Format the sort columns into individual params that the function accepts
        const firstSort = sortConfig[0];
        
        // Call the function with the first sort column as primary and others passed separately
        const { data: responseData, error } = await supabase.rpc('filter_open_trades', {
          p_filters: filtersParam,
          p_page: paginationParams.page,
          p_page_size: paginationParams.pageSize,
          p_sort_column: firstSort.column,
          p_sort_direction: firstSort.direction
        });
        
        if (error) throw error;
        response = responseData;
      } else {
        // Use the default sort (sort_order ASC)
        const { data: responseData, error } = await supabase.rpc('filter_open_trades', {
          p_filters: filtersParam,
          p_page: paginationParams.page,
          p_page_size: paginationParams.pageSize,
          p_sort_column: 'sort_order',
          p_sort_direction: 'asc'
        });
        
        if (error) throw error;
        response = responseData;
      }

      // Safely convert the JSON response to our expected type
      const typedResponse = response as unknown as FilteredOpenTradesResponse;
      
      // Validate the response structure to avoid runtime errors
      if (!typedResponse || !typedResponse.trades || !typedResponse.pagination) {
        console.error('[FILTERED OPEN TRADES] Invalid response format:', response);
        return { trades: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: paginationParams.pageSize } };
      }
      
      // Check if no results were found
      setNoResultsFound(typedResponse.trades.length === 0 && activeFilterCount > 0);
      
      return typedResponse;
    },
  });

  return {
    openTrades: data?.trades || [],
    pagination: data?.pagination,
    loading: isLoading,
    error,
    refetchOpenTrades: refetch,
    activeFilterCount,
    noResultsFound
  };
};
