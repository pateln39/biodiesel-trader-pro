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
import { createEmptyFormula, validateAndParsePricingFormula } from '@/utils/paperFormulaUtils';

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
  
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("Skipping paper trade refetch as deletion is in progress");
      return;
    }
    console.log("Executing debounced paper trade refetch");
    fn();
  }, 500)).current;
  
  const { data: paperTrades, isLoading, error, refetch } = useQuery({
    queryKey: ['paper-trades'],
    queryFn: async () => {
      const { data: paperTradesData, error: parentError } = await supabase
        .from('paper_trades')
        .select(`
          id,
          trade_reference,
          counterparty,
          broker,
          comment,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });
        
      if (parentError) {
        throw new Error(`Error fetching paper trades: ${parentError.message}`);
      }
      
      const tradesWithLegs = await Promise.all(
        (paperTradesData || []).map(async (parentTrade) => {
          const { data: legs, error: legsError } = await supabase
            .from('paper_trade_legs')
            .select('*')
            .eq('parent_trade_id', parentTrade.id)
            .order('leg_reference', { ascending: true });
            
          if (legsError) {
            throw new Error(`Error fetching paper trade legs: ${legsError.message}`);
          }
          
          return {
            id: parentTrade.id,
            tradeReference: parentTrade.trade_reference,
            tradeType: 'paper' as const,
            counterparty: parentTrade.counterparty || '',
            createdAt: new Date(parentTrade.created_at),
            updatedAt: new Date(parentTrade.updated_at),
            comment: parentTrade.comment,
            broker: parentTrade.broker,
            legs: (legs || []).map((leg) => {
              let rightSide: any = undefined;
              if (leg.right_side_product) {
                rightSide = {
                  product: leg.right_side_product,
                  quantity: leg.right_side_quantity,
                  period: leg.right_side_period,
                  price: leg.right_side_price
                };
              }
              
              return {
                id: leg.id,
                parentTradeId: leg.parent_trade_id,
                legReference: leg.leg_reference,
                buySell: leg.buy_sell as BuySell,
                product: leg.product as Product,
                quantity: leg.quantity,
                period: leg.period || '', 
                price: leg.price || 0,
                broker: leg.broker,
                instrument: leg.instrument,
                relationshipType: leg.relationship_type as PaperRelationshipType,
                rightSide: rightSide,
                formula: validateAndParsePricingFormula(leg.formula),
                mtmFormula: validateAndParsePricingFormula(leg.mtm_formula)
              };
            })
          };
        })
      );
      
      return tradesWithLegs as PaperTrade[];
    },
    staleTime: 2000,
    refetchOnWindowFocus: false
  });
  
  const setupRealtimeSubscriptions = useCallback(() => {
    cleanupSubscriptions(realtimeChannelsRef.current);
    
    const paperTradesChannel = supabase
      .channel('paper_trades_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'paper_trades',
      }, () => {
        if (!isProcessingRef.current) {
          console.log('Paper trades changed, debouncing refetch...');
          debouncedRefetch(refetch);
        }
      })
      .subscribe();

    realtimeChannelsRef.current.paperTradesChannel = paperTradesChannel;

    const paperTradeLegsChannel = supabase
      .channel('paper_trade_legs_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'paper_trade_legs' 
      }, () => {
        if (!isProcessingRef.current) {
          console.log('Paper trade legs changed, debouncing refetch...');
          debouncedRefetch(refetch);
        }
      })
      .subscribe();

    realtimeChannelsRef.current.paperTradeLegsChannel = paperTradeLegsChannel;
  }, [refetch, debouncedRefetch]);
  
  useEffect(() => {
    setupRealtimeSubscriptions();
    
    return () => {
      cleanupSubscriptions(realtimeChannelsRef.current);
    };
  }, [setupRealtimeSubscriptions]);
  
  const deletePaperTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      try {
        isProcessingRef.current = true;
        console.log("Setting isProcessing to true for deletePaperTrade");
        
        cleanupSubscriptions(realtimeChannelsRef.current);
        
        queryClient.setQueryData(['paper-trades'], (oldData: any) => {
          return oldData.filter((trade: any) => trade.id !== tradeId);
        });
        
        const success = await deletePaperTrade(tradeId);
        
        await delay(800);
        
        return { success, tradeId };
      } catch (error) {
        console.error("Error in deletePaperTradeMutation:", error);
        throw error;
      } finally {
        setupRealtimeSubscriptions();
        
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("Setting isProcessing to false for deletePaperTrade");
        }, 500);
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Paper trade deleted successfully");
      }
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
      }, 500);
    },
    onError: (error) => {
      toast.error("Failed to delete paper trade", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      }, 500);
    }
  });
  
  const { mutate: createPaperTrade, isPending: isCreating } = useMutation({
    mutationFn: async (trade: Partial<PaperTrade>) => {
      const { data: paperTrade, error: parentError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: trade.tradeReference,
          counterparty: trade.counterparty || trade.broker || 'Paper Trade',
          comment: trade.comment || '',
          broker: trade.broker || ''
        })
        .select('id')
        .single();
        
      if (parentError) {
        throw new Error(`Error creating paper trade: ${parentError.message}`);
      }
      
      if (trade.legs && trade.legs.length > 0) {
        for (let i = 0; i < trade.legs.length; i++) {
          const leg = trade.legs[i];
          const legReference = generateLegReference(trade.tradeReference || '', i);
          const instrument = generateInstrumentName(
            leg.product, 
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          const legData = {
            parent_trade_id: paperTrade.id,
            leg_reference: legReference,
            buy_sell: leg.buySell,
            product: leg.product,
            quantity: leg.quantity,
            period: leg.period || '',
            price: leg.price || 0,
            broker: leg.broker || trade.broker || '',
            relationship_type: leg.relationshipType,
            instrument: instrument,
            formula: leg.formula,
            mtm_formula: leg.mtmFormula,
            right_side_product: leg.rightSide?.product,
            right_side_quantity: leg.rightSide?.quantity,
            right_side_period: leg.rightSide?.period,
            right_side_price: leg.rightSide?.price
          };
          
          const { error: legError } = await supabase
            .from('paper_trade_legs')
            .insert(legData);
            
          if (legError) {
            throw new Error(`Error creating trade leg: ${legError.message}`);
          }
        }
      }
      
      return { ...trade, id: paperTrade.id };
    },
    onSuccess: () => {
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
