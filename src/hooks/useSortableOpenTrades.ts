
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenTrade, useOpenTrades } from '@/hooks/useOpenTrades';
import { PaginationParams, PaginationMeta } from '@/types/pagination';
import { OpenTradesFilters } from '@/components/operations/OpenTradesFilter';

export const useSortableOpenTrades = (
  filterStatus: 'all' | 'in-process' | 'completed' = 'all',
  filters?: OpenTradesFilters,
  paginationParams?: PaginationParams
) => {
  const { openTrades, loading, error, refetchOpenTrades, pagination } = useOpenTrades(paginationParams);
  const [localTrades, setLocalTrades] = useState<OpenTrade[]>([]);
  const queryClient = useQueryClient();

  // Update local state when open trades change from the API
  useEffect(() => {
    if (openTrades?.length) {
      console.log('[OPEN_TRADES] Updating local trades state with', openTrades.length, 'items');
      // Trades already come sorted by sort_order from the API
      setLocalTrades(openTrades);
    }
  }, [openTrades]);

  // Filter trades based on all filters
  const filteredTrades = useMemo(() => {
    if (!localTrades.length) return [];
    
    return localTrades.filter(trade => {
      // Status filter
      if (filterStatus === 'in-process' && 
          trade.balance !== undefined && 
          trade.balance !== null && 
          trade.balance <= 0) {
        return false;
      }
      
      if (filterStatus === 'completed' && 
          (trade.balance === undefined || 
           trade.balance === null || 
           trade.balance > 0)) {
        return false;
      }
      
      // Apply additional filters if provided
      if (filters) {
        // Counterparty filter
        if (filters.counterparty && trade.counterparty !== filters.counterparty) {
          return false;
        }
        
        // Product filter
        if (filters.product && trade.product !== filters.product) {
          return false;
        }
        
        // Sustainability filter
        if (filters.sustainability && trade.sustainability !== filters.sustainability) {
          return false;
        }
        
        // Buy/Sell filter
        if (filters.buySell && filters.buySell !== 'all' && trade.buy_sell !== filters.buySell) {
          return false;
        }
        
        // Loading period start date filter
        if (filters.loadingStartDate && trade.loading_period_start) {
          const filterDate = new Date(filters.loadingStartDate);
          const tradeDate = new Date(trade.loading_period_start);
          
          // Filter out trades with loading period start before the filter date
          if (tradeDate < filterDate) {
            return false;
          }
        }
        
        // Loading period end date filter
        if (filters.loadingEndDate && trade.loading_period_end) {
          const filterDate = new Date(filters.loadingEndDate);
          const tradeDate = new Date(trade.loading_period_end);
          
          // Filter out trades with loading period end after the filter date
          if (tradeDate > filterDate) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [localTrades, filterStatus, filters]);

  // Mutation to update the sort order in the database
  const updateSortOrderMutation = useMutation({
    mutationFn: async ({
      id,
      newSortOrder,
    }: {
      id: string;
      newSortOrder: number;
    }) => {
      console.log(`[OPEN_TRADES] Updating sort_order for item ${id} to ${newSortOrder}`);
      
      // Call the update_sort_order database function
      const { data, error } = await supabase.rpc('update_sort_order', {
        p_table_name: 'open_trades',
        p_id: id,
        p_new_sort_order: newSortOrder,
      });

      if (error) {
        console.error('[OPEN_TRADES] Error updating sort_order:', error);
        throw error;
      }
      
      console.log(`[OPEN_TRADES] Successfully updated sort_order for item ${id}`);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      console.log('[OPEN_TRADES] Sort order update successful - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
    },
    onError: (error) => {
      console.error('[OPEN_TRADES] Error in updateSortOrderMutation:', error);
    }
  });

  // Function to handle reordering
  const handleReorder = useCallback(
    async (reorderedItems: OpenTrade[]) => {
      console.log('[OPEN_TRADES] Starting reordering process for', reorderedItems.length, 'items');
      
      // Calculate base sort_order for the current page
      const pageOffset = paginationParams && paginationParams.page > 1 
        ? (paginationParams.page - 1) * (paginationParams.pageSize || 15) 
        : 0;

      // Update local state immediately for a responsive UI
      setLocalTrades(reorderedItems);

      // Get the moved item and its new index
      const updatedItems = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: pageOffset + index + 1,
      }));

      console.log('[OPEN_TRADES] Prepared sort_order updates:', 
        updatedItems.slice(0, 3).map(i => `${i.id.slice(-4)}: ${i.sort_order}`).join(', '), '...');

      // Update each item's sort order in the database
      try {
        // Use Promise.all to execute all updates in parallel
        await Promise.all(
          updatedItems.map(item => 
            updateSortOrderMutation.mutate({
              id: item.id,
              newSortOrder: item.sort_order,
            })
          )
        );
        console.log('[OPEN_TRADES] All sort_order updates completed successfully');
      } catch (error) {
        console.error('[OPEN_TRADES] Error updating sort order:', error);
        // Revert to the original order
        console.log('[OPEN_TRADES] Reverting to original order');
        refetchOpenTrades();
      }
    },
    [updateSortOrderMutation, refetchOpenTrades, paginationParams]
  );

  return {
    openTrades: localTrades,
    filteredTrades,
    loading,
    error,
    refetchOpenTrades,
    handleReorder,
    pagination
  };
};
