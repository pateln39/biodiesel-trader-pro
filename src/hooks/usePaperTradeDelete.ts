
import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deletePaperTrade } from '@/utils/paperTradeDeleteUtils';
import { delay } from '@/utils/subscriptionUtils';

/**
 * Hook for paper trade deletion operations with complete isolation 
 * from physical trade operations
 */
export const usePaperTradeDelete = () => {
  const queryClient = useQueryClient();
  const isProcessingRef = useRef<boolean>(false);
  
  const deletePaperTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      try {
        // Set processing flag specific to paper trades
        isProcessingRef.current = true;
        console.log("[PAPER DELETE] Setting isProcessing to true for paper trade deletion");
        
        // Optimistic UI update for better responsiveness
        queryClient.setQueryData(['paper-trades'], (oldData: any) => {
          return oldData.filter((trade: any) => trade.id !== tradeId);
        });
        
        // Perform the actual deletion
        const success = await deletePaperTrade(tradeId);
        
        // Add a small delay to allow the database to settle
        await delay(800);
        
        return { success, tradeId };
      } catch (error) {
        console.error("[PAPER DELETE] Error in deletePaperTradeMutation:", error);
        throw error;
      } finally {
        // Clean timeout to release processing flag with a delay to avoid race conditions
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("[PAPER DELETE] Setting isProcessing to false for paper trade deletion");
        }, 700);
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Paper trade deleted successfully");
      }
      
      // Invalidate queries with a delay to ensure proper state sync
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
      }, 1000);
    },
    onError: (error) => {
      toast.error("Failed to delete paper trade", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Retry query invalidation with delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      }, 1000);
    }
  });
  
  return {
    deletePaperTrade: deletePaperTradeMutation.mutate,
    isDeletePaperTradeLoading: deletePaperTradeMutation.isPending,
    isProcessing: () => isProcessingRef.current
  };
};
