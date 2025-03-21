import React, { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Trade,
  TradeType,
  PhysicalTrade,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  DbParentTrade,
  DbTradeLeg,
} from '@/types';
import { createEmptyFormula, validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { deletePhysicalTrade, deletePhysicalTradeLeg } from '@/utils/physicalTradeDeleteUtils';
import { cleanupSubscriptions, delay, pauseSubscriptions, resumeSubscriptions } from '@/utils/subscriptionUtils';
import { toast } from 'sonner';

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

const fetchTrades = async (): Promise<Trade[]> => {
  try {
    const { data: parentTrades, error: parentTradesError } = await supabase
      .from('parent_trades')
      .select('*')
      .eq('trade_type', 'physical')
      .order('created_at', { ascending: false });

    if (parentTradesError) {
      throw new Error(`Error fetching parent trades: ${parentTradesError.message}`);
    }

    const { data: tradeLegs, error: tradeLegsError } = await supabase
      .from('trade_legs')
      .select('*')
      .order('created_at', { ascending: false });

    if (tradeLegsError) {
      throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
    }

    const mappedTrades = parentTrades.map((parent: DbParentTrade) => {
      const legs = tradeLegs.filter((leg: DbTradeLeg) => leg.parent_trade_id === parent.id);
      
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === 'physical' && firstLeg) {
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
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula),
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
            formula: validateAndParsePricingFormula(leg.pricing_formula),
            mtmFormula: validateAndParsePricingFormula(leg.mtm_formula)
          }))
        };
        return physicalTrade;
      } 
      
      return {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: parent.trade_type as TradeType,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        counterparty: parent.counterparty,
        buySell: 'buy' as BuySell,
        product: 'UCOME' as Product,
        legs: []
      } as Trade;
    });

    return mappedTrades;
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
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
    queryKey: ['trades'],
    queryFn: fetchTrades,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 2000,
  });

  const setupRealtimeSubscriptions = useCallback(() => {
    cleanupSubscriptions(realtimeChannelsRef.current);
    
    const parentTradesChannel = supabase
      .channel('physical_parent_trades')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parent_trades',
        filter: 'trade_type=eq.physical'
      }, (payload) => {
        if (realtimeChannelsRef.current.parentTradesChannel?.isPaused) {
          console.log('Subscription paused, skipping update for parent_trades');
          return;
        }
        
        if (!isProcessingRef.current) {
          console.log('Physical parent trades changed, debouncing refetch...', payload);
          debouncedRefetch(refetch);
        }
      })
      .subscribe();
    
    realtimeChannelsRef.current.parentTradesChannel = parentTradesChannel;

    const tradeLegsChannel = supabase
      .channel('trade_legs_for_physical')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_legs' 
      }, (payload) => {
        if (realtimeChannelsRef.current.tradeLegsChannel?.isPaused) {
          console.log('Subscription paused, skipping update for trade_legs');
          return;
        }
        
        if (!isProcessingRef.current) {
          console.log('Trade legs changed, debouncing refetch...', payload);
          debouncedRefetch(refetch);
        }
      })
      .subscribe();
    
    realtimeChannelsRef.current.tradeLegsChannel = tradeLegsChannel;
  }, [refetch, debouncedRefetch]);

  useEffect(() => {
    setupRealtimeSubscriptions();
    
    return () => {
      cleanupSubscriptions(realtimeChannelsRef.current);
    };
  }, [setupRealtimeSubscriptions]);

  const deletePhysicalTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      try {
        isProcessingRef.current = true;
        console.log("Setting isProcessing to true for deletePhysicalTrade");
        
        pauseSubscriptions(realtimeChannelsRef.current);
        
        queryClient.setQueryData(['trades'], (oldData: any) => {
          return oldData.filter((trade: any) => trade.id !== tradeId);
        });
        
        const success = await deletePhysicalTrade(tradeId);
        
        await delay(800);
        
        return { success, tradeId };
      } catch (error) {
        console.error("Error in deletePhysicalTradeMutation:", error);
        throw error;
      } finally {
        resumeSubscriptions(realtimeChannelsRef.current);
        
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("Setting isProcessing to false for deletePhysicalTrade");
        }, 500);
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Physical trade deleted successfully");
      }
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 800);
    },
    onError: (error) => {
      toast.error("Failed to delete physical trade", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 800);
    }
  });

  const deletePhysicalTradeLegMutation = useMutation({
    mutationFn: async ({ legId, tradeId }: { legId: string; tradeId: string }) => {
      try {
        isProcessingRef.current = true;
        console.log("Setting isProcessing to true for deletePhysicalTradeLeg");
        
        pauseSubscriptions(realtimeChannelsRef.current);
        
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
        
        const success = await deletePhysicalTradeLeg(legId);
        
        await delay(800);
        
        return { success, legId, tradeId };
      } catch (error) {
        console.error("Error in deletePhysicalTradeLegMutation:", error);
        throw error;
      } finally {
        resumeSubscriptions(realtimeChannelsRef.current);
        
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
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 800);
    },
    onError: (error) => {
      toast.error("Failed to delete trade leg", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
      }, 800);
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
