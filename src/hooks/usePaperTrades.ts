import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PaperTrade, PaperTradeLeg, PaperRelationshipType, BuySell, Product } from '@/types/trade';
import { formatMonthCode } from '@/utils/dateUtils';
import { 
  generateLegReference, 
  formatProductDisplay, 
  formatMTMDisplay,
  generateInstrumentName 
} from '@/utils/tradeUtils';
import { deletePaperTrade, delay, cleanupSubscriptions } from '@/utils/tradeDeleteUtils';

// Debounce function to prevent multiple refetches in quick succession
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  // Debounced refetch function with additional safeguard
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("Skipping paper trade refetch as deletion is in progress");
      return;
    }
    console.log("Executing debounced paper trade refetch");
    fn();
  }, 500)).current;
  
  // Fetch paper trades
  const { data: paperTrades, isLoading, error, refetch } = useQuery({
    queryKey: ['paper-trades'],
    queryFn: async () => {
      // Fetch parent trades of type 'paper'
      const { data: parentTrades, error: parentError } = await supabase
        .from('parent_trades')
        .select(`
          id,
          trade_reference,
          counterparty,
          created_at,
          updated_at,
          comment
        `)
        .eq('trade_type', 'paper')
        .order('created_at', { ascending: false });
        
      if (parentError) {
        throw new Error(`Error fetching paper trades: ${parentError.message}`);
      }
      
      // For each parent trade, fetch its legs
      const tradesWithLegs = await Promise.all(
        (parentTrades || []).map(async (parentTrade) => {
          const { data: legs, error: legsError } = await supabase
            .from('trade_legs')
            .select('*')
            .eq('parent_trade_id', parentTrade.id)
            .order('leg_reference', { ascending: true });
            
          if (legsError) {
            throw new Error(`Error fetching trade legs: ${legsError.message}`);
          }
          
          return {
            id: parentTrade.id,
            tradeReference: parentTrade.trade_reference,
            tradeType: 'paper' as const,
            counterparty: parentTrade.counterparty || '',
            createdAt: new Date(parentTrade.created_at),
            updatedAt: new Date(parentTrade.updated_at),
            comment: parentTrade.comment,
            broker: legs && legs[0] ? legs[0].broker : '',
            legs: (legs || []).map((leg) => {
              // Extract the relationship_type from instrument
              const instrument = leg.instrument || '';
              let relationshipType: PaperRelationshipType = 'FP';
              
              if (instrument.includes('DIFF')) {
                relationshipType = 'DIFF';
              } else if (instrument.includes('SPREAD')) {
                relationshipType = 'SPREAD';
              }
              
              // Safely extract rightSide from mtm_formula if it exists
              let rightSide;
              if (leg.mtm_formula && 
                 typeof leg.mtm_formula === 'object' && 
                 'rightSide' in leg.mtm_formula) {
                rightSide = leg.mtm_formula.rightSide;
              }
              
              return {
                id: leg.id,
                parentTradeId: leg.parent_trade_id,
                legReference: leg.leg_reference,
                buySell: leg.buy_sell as BuySell,
                product: leg.product as Product,
                quantity: leg.quantity,
                period: leg.trading_period || '', 
                price: leg.price || 0,
                broker: leg.broker,
                instrument: leg.instrument,
                relationshipType,
                rightSide: rightSide,
                formula: leg.pricing_formula,
                mtmFormula: leg.mtm_formula
              };
            })
          };
        })
      );
      
      return tradesWithLegs as PaperTrade[];
    },
    staleTime: 2000, // Consider data stale after 2 seconds
    refetchOnWindowFocus: false // Disable automatic refetch on window focus
  });
  
  // Setup and cleanup function for realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    // First clean up any existing subscriptions
    cleanupSubscriptions(realtimeChannelsRef.current);
    
    // Subscribe to changes on parent_trades table for paper trades
    const paperParentTradesChannel = supabase
      .channel('paper_parent_trades')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parent_trades',
        filter: 'trade_type=eq.paper'
      }, () => {
        if (!isProcessingRef.current) {
          console.log('Paper trades changed, debouncing refetch...');
          debouncedRefetch(refetch);
        }
      })
      .subscribe();

    realtimeChannelsRef.current.paperParentTradesChannel = paperParentTradesChannel;

    // Subscribe to changes on trade_legs table for paper trades
    const paperTradeLegsChannel = supabase
      .channel('paper_trade_legs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_legs' 
      }, () => {
        if (!isProcessingRef.current) {
          console.log('Paper trade legs changed, debouncing refetch...');
          debouncedRefetch(refetch);
        }
      })
      .subscribe();

    realtimeChannelsRef.current.paperTradeLegsChannel = paperTradeLegsChannel;
  }, [refetch, debouncedRefetch]);
  
  // Set up real-time subscription with improved cleanup
  useEffect(() => {
    setupRealtimeSubscriptions();
    
    // Cleanup subscriptions on unmount
    return () => {
      cleanupSubscriptions(realtimeChannelsRef.current);
    };
  }, [setupRealtimeSubscriptions]);
  
  // Mutation for deleting a paper trade with improved error handling
  const deletePaperTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      try {
        // Mark as processing to prevent concurrent operations and realtime updates
        isProcessingRef.current = true;
        console.log("Setting isProcessing to true for deletePaperTrade");
        
        // Temporarily remove realtime subscriptions during deletion
        cleanupSubscriptions(realtimeChannelsRef.current);
        
        // First update UI optimistically
        queryClient.setQueryData(['paper-trades'], (oldData: any) => {
          // Filter out the deleted trade
          return oldData.filter((trade: any) => trade.id !== tradeId);
        });
        
        // Then perform actual deletion
        const success = await deletePaperTrade(tradeId);
        
        // Wait a little bit before refetching to allow database operations to complete
        await delay(800);
        
        return { success, tradeId };
      } catch (error) {
        console.error("Error in deletePaperTradeMutation:", error);
        throw error;
      } finally {
        // Re-establish subscriptions
        setupRealtimeSubscriptions();
        
        // Reset processing flag
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("Setting isProcessing to false for deletePaperTrade");
        }, 500);
      }
    },
    onSuccess: (data) => {
      // Only show success message after deletion completes
      if (data.success) {
        toast.success("Paper trade deleted successfully");
      }
      
      // Invalidate affected queries after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
      }, 500);
    },
    onError: (error) => {
      toast.error("Failed to delete paper trade", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Refetch to make sure UI is consistent with database
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      }, 500);
    }
  });
  
  // Create paper trade mutation
  const { mutate: createPaperTrade, isPending: isCreating } = useMutation({
    mutationFn: async (trade: Partial<PaperTrade>) => {
      // Store the original product selection in the comment field for reference
      let comment = trade.comment || '';
      
      // Insert parent trade - store the product info in the comment
      const { data: parentTrade, error: parentError } = await supabase
        .from('parent_trades')
        .insert({
          trade_reference: trade.tradeReference,
          trade_type: 'paper',
          comment: comment,
          // Use the broker name as a placeholder if needed
          counterparty: trade.broker || 'Paper Trade'
        })
        .select('id')
        .single();
        
      if (parentError) {
        throw new Error(`Error creating paper trade: ${parentError.message}`);
      }
      
      // Prepare legs for insertion
      if (trade.legs && trade.legs.length > 0) {
        // Insert trade legs one by one
        for (let i = 0; i < trade.legs.length; i++) {
          const leg = trade.legs[i];
          // Generate leg reference with alphabetical suffix
          const legReference = generateLegReference(trade.tradeReference || '', i);
          
          // Store the period in both trading_period and pricing_period_start/end for consistency
          const tradingPeriod = leg.period;
          
          // Parse period if available
          let pricingPeriodStart = null;
          let pricingPeriodEnd = null;
          
          if (tradingPeriod) {
            try {
              // Parse period like "Mar-24" into a date
              const [month, year] = tradingPeriod.split('-');
              const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                .findIndex(m => m === month);
              
              if (monthIndex !== -1) {
                const fullYear = 2000 + parseInt(year);
                
                // First day of month
                pricingPeriodStart = new Date(fullYear, monthIndex, 1).toISOString();
                
                // Last day of month
                const lastDay = new Date(fullYear, monthIndex + 1, 0).getDate();
                pricingPeriodEnd = new Date(fullYear, monthIndex, lastDay).toISOString();
              }
            } catch (e) {
              console.error('Error parsing period date:', e);
            }
          }
          
          // Prepare mtmFormula with rightSide info
          let mtmFormula = leg.mtmFormula || {};
          
          // For DIFF/SPREAD trades, capture both sides in the exposures
          if (leg.relationshipType !== 'FP' && leg.rightSide) {
            mtmFormula = {
              ...mtmFormula,
              rightSide: leg.rightSide,
              exposures: {
                physical: {
                  [leg.product]: leg.quantity || 0,
                  [leg.rightSide.product]: leg.rightSide.quantity || 0
                }
              }
            };
          }
          
          // Generate the instrument name (for database storage - MTM format)
          const instrument = generateInstrumentName(
            leg.product, 
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          const legData = {
            leg_reference: legReference,
            parent_trade_id: parentTrade.id,
            buy_sell: leg.buySell,
            product: leg.product,
            quantity: leg.quantity,
            price: leg.price,
            broker: leg.broker || trade.broker,
            trading_period: tradingPeriod,
            pricing_formula: leg.formula,
            mtm_formula: mtmFormula,
            pricing_period_start: pricingPeriodStart,
            pricing_period_end: pricingPeriodEnd,
            instrument: instrument
          };
          
          const { error: legError } = await supabase
            .from('trade_legs')
            .insert(legData);
            
          if (legError) {
            throw new Error(`Error creating trade leg: ${legError.message}`);
          }
        }
      }
      
      return { ...trade, id: parentTrade.id };
    },
    onSuccess: () => {
      // Use a delay before invalidating queries
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
        toast.success('Paper trade created successfully');
      }, 500);
    },
    onError: (error: Error) => {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
    }
  });
  
  return {
    paperTrades: paperTrades || [],
    isLoading,
    error,
    createPaperTrade,
    isCreating,
    refetchPaperTrades: refetch,
    deletePaperTrade: deletePaperTradeMutation.mutate,
    isDeletePaperTradeLoading: deletePaperTradeMutation.isPending
  };
};
