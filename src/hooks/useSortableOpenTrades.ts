
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenTrade, useOpenTrades } from '@/hooks/useOpenTrades';

export const useSortableOpenTrades = (filterStatus: 'all' | 'in-process' | 'completed' = 'all') => {
  const { openTrades, loading, error, refetchOpenTrades } = useOpenTrades();
  const [localTrades, setLocalTrades] = useState<OpenTrade[]>([]);
  const queryClient = useQueryClient();

  // Update local state when open trades change from the API
  useEffect(() => {
    if (openTrades?.length) {
      console.log('[OPEN_TRADES] Updating local trades state with', openTrades.length, 'items');
      // Sort by sort_order if it exists, otherwise by created_at
      const sortedTrades = [...openTrades].sort((a, b) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      console.log('[OPEN_TRADES] First few sort_order values:', 
        sortedTrades.slice(0, 5).map(t => t.sort_order).join(', '));
      setLocalTrades(sortedTrades);
    }
  }, [openTrades]);

  // Filter trades based on filterStatus
  const filteredTrades = useMemo(() => {
    if (!localTrades.length) return [];
    
    if (filterStatus === 'all') {
      return localTrades;
    } else if (filterStatus === 'in-process') {
      return localTrades.filter(trade => 
        trade.balance === undefined || 
        trade.balance === null || 
        trade.balance > 0
      );
    } else if (filterStatus === 'completed') {
      return localTrades.filter(trade => 
        trade.balance !== undefined && 
        trade.balance !== null && 
        trade.balance <= 0
      );
    }
    
    return localTrades;
  }, [localTrades, filterStatus]);

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
      
      // Update local state immediately for a responsive UI
      setLocalTrades(reorderedItems);

      // Get the moved item and its new index
      const updatedItems = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
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
    [updateSortOrderMutation, refetchOpenTrades]
  );

  return {
    openTrades: localTrades,
    filteredTrades,
    loading,
    error,
    refetchOpenTrades,
    handleReorder,
  };
};
