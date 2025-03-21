
import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deletePhysicalTrade, deletePhysicalTradeLeg } from '@/utils/physicalTradeDeleteUtils';
import { delay } from '@/utils/subscriptionUtils';
import { PhysicalTrade } from '@/types';

/**
 * Hook for physical trade deletion operations with complete isolation 
 * from paper trade operations
 */
export const usePhysicalTradeDelete = () => {
  const queryClient = useQueryClient();
  const isProcessingRef = useRef<boolean>(false);
  
  const deletePhysicalTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      try {
        // Set processing flag specific to physical trades
        isProcessingRef.current = true;
        console.log("[PHYSICAL DELETE] Setting isProcessing to true for physical trade deletion");
        
        // Optimistic UI update for better responsiveness
        queryClient.setQueryData(['trades'], (oldData: any) => {
          return oldData.filter((trade: any) => trade.id !== tradeId);
        });
        
        // Perform the actual deletion
        const success = await deletePhysicalTrade(tradeId);
        
        // Add a small delay to allow the database to settle
        await delay(800);
        
        return { success, tradeId };
      } catch (error) {
        console.error("[PHYSICAL DELETE] Error in deletePhysicalTradeMutation:", error);
        throw error;
      } finally {
        // Clean timeout to release processing flag with a delay to avoid race conditions
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("[PHYSICAL DELETE] Setting isProcessing to false for physical trade deletion");
        }, 700);
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Physical trade deleted successfully");
      }
      
      // Invalidate queries with a delay to ensure proper state sync
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 1000);
    },
    onError: (error) => {
      toast.error("Failed to delete physical trade", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Retry query invalidation with delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 1000);
    }
  });

  const deletePhysicalTradeLegMutation = useMutation({
    mutationFn: async ({ legId, tradeId }: { legId: string; tradeId: string }) => {
      try {
        // Set processing flag specific to physical trades
        isProcessingRef.current = true;
        console.log("[PHYSICAL DELETE] Setting isProcessing to true for physical trade leg deletion");
        
        // Optimistic UI update for better responsiveness
        queryClient.setQueryData(['trades'], (oldData: any) => {
          return oldData.map((trade: PhysicalTrade) => {
            if (trade.id === tradeId) {
              return {
                ...trade,
                legs: trade.legs?.filter(leg => leg.id !== legId) || []
              };
            }
            return trade;
          });
        });
        
        // Perform the actual deletion
        const success = await deletePhysicalTradeLeg(legId);
        
        // Add a small delay to allow the database to settle
        await delay(800);
        
        return { success, legId, tradeId };
      } catch (error) {
        console.error("[PHYSICAL DELETE] Error in deletePhysicalTradeLegMutation:", error);
        throw error;
      } finally {
        // Clean timeout to release processing flag with a delay to avoid race conditions
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("[PHYSICAL DELETE] Setting isProcessing to false for physical trade leg deletion");
        }, 700);
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Trade leg deleted successfully");
      }
      
      // Invalidate queries with a delay to ensure proper state sync
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 1000);
    },
    onError: (error) => {
      toast.error("Failed to delete trade leg", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Retry query invalidation with delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 1000);
    }
  });
  
  return {
    deletePhysicalTrade: deletePhysicalTradeMutation.mutate,
    isDeletePhysicalTradeLoading: deletePhysicalTradeMutation.isPending,
    deletePhysicalTradeLeg: deletePhysicalTradeLegMutation.mutate,
    isDeletePhysicalTradeLegLoading: deletePhysicalTradeLegMutation.isPending,
    isProcessing: () => isProcessingRef.current
  };
};
