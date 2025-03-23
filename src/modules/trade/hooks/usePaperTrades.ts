import React, { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  TradeType,
  BuySell,
  PaperProduct,
  PaperTrade,
  Broker,
  TradingPeriod
} from '@/modules/trade/types';
import { validateAndParsePricingFormula } from '@/modules/pricing/utils/formulaUtils';

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

const fetchPaperTrades = async (): Promise<PaperTrade[]> => {
  try {
    const { data: paperTrades, error: paperTradesError } = await supabase
      .from('paper_trades')
      .select('*, paper_trade_legs(*)')
      .order('created_at', { ascending: false });

    if (paperTradesError) {
      throw new Error(`Error fetching paper trades: ${paperTradesError.message}`);
    }

    // Transform the data to match the PaperTrade interface
    const transformedPaperTrades: PaperTrade[] = paperTrades.map((trade: any) => {
      return {
        id: trade.id,
        tradeReference: trade.trade_reference,
        tradeType: TradeType.Paper,
        counterparty: trade.counterparty,
        broker: trade.broker,
        comment: trade.comment,
        createdAt: new Date(trade.created_at),
        updatedAt: new Date(trade.updated_at),
        legs: (trade.paper_trade_legs || []).map((leg: any) => ({
          id: leg.id,
          paperTradeId: leg.paper_trade_id,
          legReference: leg.leg_reference,
          buySell: leg.buy_sell === 'buy' ? BuySell.Buy : BuySell.Sell,
          product: leg.product as PaperProduct,
          period: leg.period,
          tradingPeriod: leg.trading_period,
          quantity: leg.quantity,
          price: leg.price,
          broker: leg.broker,
          instrument: leg.instrument,
          pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : undefined,
          pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : undefined,
          formula: validateAndParsePricingFormula(leg.formula),
          mtmFormula: validateAndParsePricingFormula(leg.mtm_formula),
          exposures: leg.exposures,
          relationshipType: leg.relationship_type,
          rightSide: leg.right_side ? {
            product: leg.right_side.product as PaperProduct,
            quantity: leg.right_side.quantity,
            period: leg.right_side.period
          } : undefined
        }))
      };
    });

    return transformedPaperTrades;
  } catch (error: any) {
    console.error('[PAPER] Error fetching paper trades:', error);
    throw new Error(error.message);
  }
};

export const setupPaperTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<{ [key: string]: any }>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: Function,
  refetch: Function
) => {
  // Subscribe to paper_trades table changes
  console.log('[PAPER] Setting up paper_trades subscription');
  realtimeChannelsRef.current.paperTrades = supabase
    .channel('paper_trades_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'paper_trades'
    }, () => {
      console.log('[PAPER] Paper trades changed, triggering refetch');
      debouncedRefetch(() => refetch());
    })
    .subscribe((status) => {
      console.log('[PAPER] Paper trades subscription status:', status);
    });

  // Subscribe to paper_trade_legs table changes
  console.log('[PAPER] Setting up paper_trade_legs subscription');
  realtimeChannelsRef.current.paperTradeLegs = supabase
    .channel('paper_trade_legs_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'paper_trade_legs'
    }, () => {
      console.log('[PAPER] Paper trade legs changed, triggering refetch');
      debouncedRefetch(() => refetch());
    })
    .subscribe((status) => {
      console.log('[PAPER] Paper trade legs subscription status:', status);
    });

  // Return a cleanup function to unsubscribe from all channels
  return () => {
    console.log('[PAPER] Cleaning up subscriptions');
    if (realtimeChannelsRef.current.paperTrades) {
      supabase.removeChannel(realtimeChannelsRef.current.paperTrades);
    }
    if (realtimeChannelsRef.current.paperTradeLegs) {
      supabase.removeChannel(realtimeChannelsRef.current.paperTradeLegs);
    }
    realtimeChannelsRef.current = {};
  };
};

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("[PAPER] Skipping refetch as an operation is in progress");
      return;
    }
    console.log("[PAPER] Executing debounced refetch for paper trades");
    fn();
  }, 500)).current;

  const { 
    data: paperTrades = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['paperTrades'],
    queryFn: fetchPaperTrades,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 2000,
  });

  const setupRealtimeSubscriptions = useCallback(() => {
    return setupPaperTradeSubscriptions(
      realtimeChannelsRef,
      isProcessingRef,
      debouncedRefetch,
      refetch
    );
  }, [refetch, debouncedRefetch]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    
    return () => {
      cleanup();
    };
  }, [setupRealtimeSubscriptions]);

  return { 
    paperTrades, 
    isLoading, 
    error, 
    refetchPaperTrades: refetch
  };
};
