
import React, { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  PhysicalTrade,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus
} from '@/types/trade';
import { validateAndParsePhysicalFormula, createEmptyPhysicalFormula } from '@/utils/physicalFormulaUtils';
import { deletePhysicalTrade, deletePhysicalTradeLeg, delay, cleanupSubscriptions } from '@/utils/tradeDeleteUtils';
import { toast } from 'sonner';

// Debounce function to prevent multiple refetches in quick succession
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

// Define database types
interface DbPhysicalTrade {
  id: string;
  trade_reference: string;
  physical_type: string | null;
  counterparty: string;
  created_at: string;
  updated_at: string;
}

interface DbPhysicalTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  sustainability: string | null;
  inco_term: string | null;
  quantity: number;
  tolerance: number | null;
  loading_period_start: string | null;
  loading_period_end: string | null;
  pricing_period_start: string | null;
  pricing_period_end: string | null;
  unit: string | null;
  payment_term: string | null;
  credit_status: string | null;
  pricing_formula: any | null;
  created_at: string;
  updated_at: string;
  mtm_formula: any | null;
}

const fetchPhysicalTrades = async (): Promise<PhysicalTrade[]> => {
  try {
    // Get all physical trades from the physical_trades table
    const { data: physicalTradesData, error: physicalTradesError } = await supabase
      .from('physical_trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (physicalTradesError) {
      throw new Error(`Error fetching physical trades: ${physicalTradesError.message}`);
    }

    // Get all physical trade legs from the physical_trade_legs table
    const { data: physicalTradeLegsData, error: tradeLegsError } = await supabase
      .from('physical_trade_legs')
      .select('*')
      .order('created_at', { ascending: false });

    if (tradeLegsError) {
      throw new Error(`Error fetching physical trade legs: ${tradeLegsError.message}`);
    }

    // Map physical trades and legs to create the trade objects
    const mappedTrades = physicalTradesData.map((parent: DbPhysicalTrade) => {
      // Find all legs for this physical trade
      const legs = physicalTradeLegsData.filter((leg: DbPhysicalTradeLeg) => leg.parent_trade_id === parent.id);
      
      // Use the first leg for the main trade data (for backward compatibility)
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (firstLeg) {
        // Create physical trade
        const physicalTrade: PhysicalTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: 'physical', 
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          physicalType: (parent.physical_type || 'spot') as 'spot' | 'term',
          counterparty: parent.counterparty,
          buySell: firstLeg.buy_sell as BuySell,
          product: firstLeg.product as Product,
          sustainability: firstLeg.sustainability || '',
          incoTerm: (firstLeg.inco_term || 'FOB') as IncoTerm,
          quantity: firstLeg.quantity,
          tolerance: firstLeg.tolerance || 0,
          loadingPeriodStart: firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : new Date(),
          loadingPeriodEnd: firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : new Date(),
          pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
          pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
          unit: (firstLeg.unit || 'MT') as Unit,
          paymentTerm: (firstLeg.payment_term || '30 days') as PaymentTerm,
          creditStatus: (firstLeg.credit_status || 'pending') as CreditStatus,
          formula: validateAndParsePhysicalFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePhysicalFormula(firstLeg.mtm_formula),
          legs: legs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell as BuySell,
            product: leg.product as Product,
            sustainability: leg.sustainability || '',
            incoTerm: (leg.inco_term || 'FOB') as IncoTerm,
            quantity: leg.quantity,
            tolerance: leg.tolerance || 0,
            loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
            loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
            pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
            unit: (leg.unit || 'MT') as Unit,
            paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
            creditStatus: (leg.credit_status || 'pending') as CreditStatus,
            formula: validateAndParsePhysicalFormula(leg.pricing_formula),
            mtmFormula: validateAndParsePhysicalFormula(leg.mtm_formula)
          }))
        };
        return physicalTrade;
      } 
      
      // Fallback with minimal data if there are no legs
      return {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: 'physical' as const,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        physicalType: (parent.physical_type || 'spot') as 'spot' | 'term',
        counterparty: parent.counterparty,
        // Add missing required properties for PhysicalTrade
        buySell: 'buy' as BuySell,
        product: 'UCOME' as Product,
        incoTerm: 'FOB' as IncoTerm,
        quantity: 0,
        loadingPeriodStart: new Date(),
        loadingPeriodEnd: new Date(),
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
        unit: 'MT' as Unit,
        paymentTerm: '30 days' as PaymentTerm,
        creditStatus: 'pending' as CreditStatus,
        formula: createEmptyPhysicalFormula(),
        mtmFormula: createEmptyPhysicalFormula(),
        legs: []
      } as PhysicalTrade;
    });

    return mappedTrades;
  } catch (error: any) {
    console.error('Error fetching physical trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  // Debounced refetch function with additional safeguard
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("Skipping refetch as deletion is in progress");
      return;
    }
    console.log("Executing debounced refetch");
    fn();
  }, 500)).current;

  const { 
    data: trades = [], 
    isLoading: loading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['physical-trades'],
    queryFn: fetchPhysicalTrades,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 2000,
  });

  // Setup and cleanup function for realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    // First clean up any existing subscriptions
    cleanupSubscriptions(realtimeChannelsRef.current);
    
    // Subscribe to changes on physical_trades table
    const physicalTradesChannel = supabase
      .channel('physical_trades_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'physical_trades'
      }, () => {
        if (!isProcessingRef.current) {
          console.log('Physical trades changed, debouncing refetch...');
          debouncedRefetch(refetch);
        }
      })
      .subscribe();
    
    // Store the channel reference
    realtimeChannelsRef.current.physicalTradesChannel = physicalTradesChannel;

    // Subscribe to changes on physical_trade_legs table
    const physicalTradeLegsChannel = supabase
      .channel('physical_trade_legs_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'physical_trade_legs' 
      }, () => {
        if (!isProcessingRef.current) {
          console.log('Physical trade legs changed, debouncing refetch...');
          debouncedRefetch(refetch);
        }
      })
      .subscribe();
    
    // Store the channel reference
    realtimeChannelsRef.current.physicalTradeLegsChannel = physicalTradeLegsChannel;
  }, [refetch, debouncedRefetch]);

  // Set up real-time subscription to trades changes with improved cleanup
  useEffect(() => {
    setupRealtimeSubscriptions();
    
    // Cleanup subscriptions on unmount
    return () => {
      cleanupSubscriptions(realtimeChannelsRef.current);
    };
  }, [setupRealtimeSubscriptions]);

  // Mutation for deleting a physical trade with improved error handling and state management
  const deletePhysicalTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      try {
        // Mark as processing to prevent concurrent operations and realtime updates
        isProcessingRef.current = true;
        console.log("Setting isProcessing to true for deletePhysicalTrade");
        
        // Temporarily remove realtime subscriptions during deletion
        cleanupSubscriptions(realtimeChannelsRef.current);
        
        // First update UI optimistically
        queryClient.setQueryData(['physical-trades'], (oldData: any) => {
          // Filter out the deleted trade
          return oldData.filter((trade: any) => trade.id !== tradeId);
        });
        
        // Then perform actual deletion
        const success = await deletePhysicalTrade(tradeId);
        
        // Wait a little bit before refetching to allow database operations to complete
        await delay(800);
        
        return { success, tradeId };
      } catch (error) {
        console.error("Error in deletePhysicalTradeMutation:", error);
        throw error;
      } finally {
        // Re-establish subscriptions
        setupRealtimeSubscriptions();
        
        // Reset processing flag
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("Setting isProcessing to false for deletePhysicalTrade");
        }, 500);
      }
    },
    onSuccess: (data) => {
      // Only show success message after deletion completes
      if (data.success) {
        toast.success("Physical trade deleted successfully");
      }
      
      // Invalidate affected queries after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['physical-trades'] });
      }, 500);
    },
    onError: (error) => {
      toast.error("Failed to delete physical trade", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Refetch to make sure UI is consistent with database
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['physical-trades'] });
      }, 500);
    }
  });

  // Mutation for deleting a physical trade leg with improved error handling
  const deletePhysicalTradeLegMutation = useMutation({
    mutationFn: async ({ legId, tradeId }: { legId: string; tradeId: string }) => {
      try {
        // Mark as processing to prevent concurrent operations and realtime updates
        isProcessingRef.current = true;
        console.log("Setting isProcessing to true for deletePhysicalTradeLeg");
        
        // Temporarily remove realtime subscriptions during deletion
        cleanupSubscriptions(realtimeChannelsRef.current);
        
        // Optimistically update UI
        queryClient.setQueryData(['physical-trades'], (oldData: any) => {
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
        
        // Then perform actual deletion
        const success = await deletePhysicalTradeLeg(legId);
        
        // Wait a little bit before refetching to allow database operations to complete
        await delay(800);
        
        return { success, legId, tradeId };
      } catch (error) {
        console.error("Error in deletePhysicalTradeLegMutation:", error);
        throw error;
      } finally {
        // Re-establish subscriptions
        setupRealtimeSubscriptions();
        
        // Reset processing flag
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("Setting isProcessing to false for deletePhysicalTradeLeg");
        }, 500);
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Trade leg deleted successfully");
      }
      
      // Invalidate affected queries after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['physical-trades'] });
      }, 500);
    },
    onError: (error) => {
      toast.error("Failed to delete trade leg", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Refetch to make sure UI is consistent with database
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['physical-trades'] });
      }, 500);
    }
  });

  return { 
    trades, 
    loading, 
    error, 
    refetchTrades: refetch,
    deletePhysicalTrade: deletePhysicalTradeMutation.mutate,
    isDeletePhysicalTradeLoading: deletePhysicalTradeMutation.isPending,
    deletePhysicalTradeLeg: deletePhysicalTradeLegMutation.mutate,
    isDeletePhysicalTradeLegLoading: deletePhysicalTradeLegMutation.isPending
  };
};
