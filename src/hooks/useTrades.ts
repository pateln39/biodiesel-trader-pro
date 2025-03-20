import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Trade,
  TradeType,
  PhysicalTrade,
  PaperTrade,
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

const fetchTrades = async (): Promise<Trade[]> => {
  try {
    // Get all parent trades
    const { data: parentTrades, error: parentTradesError } = await supabase
      .from('parent_trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (parentTradesError) {
      throw new Error(`Error fetching parent trades: ${parentTradesError.message}`);
    }

    // Get all trade legs
    const { data: tradeLegs, error: tradeLegsError } = await supabase
      .from('trade_legs')
      .select('*')
      .order('created_at', { ascending: false });

    if (tradeLegsError) {
      throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
    }

    // Map parent trades and legs to create the trade objects
    const mappedTrades = parentTrades.map((parent: DbParentTrade) => {
      // Find all legs for this parent trade
      const legs = tradeLegs.filter((leg: DbTradeLeg) => leg.parent_trade_id === parent.id);
      
      // Use the first leg for the main trade data (for backward compatibility)
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === 'physical' && firstLeg) {
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
      
      // Fallback with minimal data if there are no legs or unknown type
      return {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: parent.trade_type as TradeType,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        counterparty: parent.counterparty,
        // Add missing required properties for Trade
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
  const { 
    data: trades = [], 
    isLoading: loading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['trades'],
    queryFn: fetchTrades,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to force refetch when component mounts
  });

  // Set up real-time subscription to trades changes
  useEffect(() => {
    // Subscribe to changes on parent_trades table
    const parentTradesChannel = supabase
      .channel('public:parent_trades')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parent_trades' 
      }, () => {
        console.log('Parent trades changed, refetching...');
        refetch();
      })
      .subscribe();

    // Subscribe to changes on trade_legs table
    const tradeLegsChannel = supabase
      .channel('public:trade_legs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_legs' 
      }, () => {
        console.log('Trade legs changed, refetching...');
        refetch();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(parentTradesChannel);
      supabase.removeChannel(tradeLegsChannel);
    };
  }, [refetch]);

  return { trades, loading, error, refetchTrades: refetch };
};
