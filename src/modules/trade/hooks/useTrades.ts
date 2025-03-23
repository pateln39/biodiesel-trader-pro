import React, { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  PhysicalType
} from '@/modules/trade/types';
import { validateAndParsePricingFormula } from '@/modules/pricing/utils/formulaUtils';
import { setupPhysicalTradeSubscriptions } from '@/modules/trade/utils/physicalTradeSubscriptionUtils';

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
      .eq('trade_type', TradeType.Physical)
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
      // Safely filter legs, handling potential API response inconsistencies
      const parentId = parent.id;
      const legs = tradeLegs ? tradeLegs.filter((leg: any) => leg.parent_trade_id === parentId) : [];
      
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === TradeType.Physical && firstLeg) {
        const physicalTrade: PhysicalTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: TradeType.Physical, 
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          physicalType: parent.physical_type === 'spot' ? PhysicalType.Spot : PhysicalType.Term,
          counterparty: parent.counterparty,
          buySell: firstLeg.buy_sell === 'buy' ? BuySell.Buy : BuySell.Sell,
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
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula || null),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula || null),
          legs: legs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell === 'buy' ? BuySell.Buy : BuySell.Sell,
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
            formula: validateAndParsePricingFormula(leg.pricing_formula || null),
            mtmFormula: validateAndParsePricingFormula(leg.mtm_formula || null)
          }))
        };
        return physicalTrade;
      } 
      
      // Default fallback
      return {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: parent.trade_type as TradeType,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        counterparty: parent.counterparty,
        buySell: BuySell.Buy,
        product: Product.UCOME,
        legs: []
      } as Trade;
    });

    return mappedTrades as Trade[];
  } catch (error: any) {
    console.error('[PHYSICAL] Error fetching trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("[PHYSICAL] Skipping refetch as an operation is in progress");
      return;
    }
    console.log("[PHYSICAL] Executing debounced refetch for physical trades");
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
    return setupPhysicalTradeSubscriptions(
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
    trades, 
    loading, 
    error, 
    refetchTrades: refetch
  };
};
