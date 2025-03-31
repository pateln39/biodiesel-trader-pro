import React, { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { setupPhysicalTradeSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';

interface DbTradeLegWithEFP extends DbTradeLeg {
  efp_premium?: number;
  efp_agreed_status?: boolean;
  efp_fixed_value?: number; 
  efp_designated_month?: string;
}

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
      const legs = tradeLegs.filter((leg) => leg.parent_trade_id === parent.id);
      
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === 'physical' && firstLeg) {
        const typedFirstLeg = firstLeg as DbTradeLegWithEFP;
        
        const physicalTrade: PhysicalTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: 'physical', 
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          physicalType: (parent.physical_type || 'spot') as 'spot' | 'term',
          counterparty: parent.counterparty,
          buySell: typedFirstLeg.buy_sell as BuySell,
          product: typedFirstLeg.product as Product,
          sustainability: typedFirstLeg.sustainability || '',
          incoTerm: (typedFirstLeg.inco_term || 'FOB') as IncoTerm,
          quantity: typedFirstLeg.quantity,
          tolerance: typedFirstLeg.tolerance || 0,
          loadingPeriodStart: typedFirstLeg.loading_period_start ? new Date(typedFirstLeg.loading_period_start) : new Date(),
          loadingPeriodEnd: typedFirstLeg.loading_period_end ? new Date(typedFirstLeg.loading_period_end) : new Date(),
          pricingPeriodStart: typedFirstLeg.pricing_period_start ? new Date(typedFirstLeg.pricing_period_start) : new Date(),
          pricingPeriodEnd: typedFirstLeg.pricing_period_end ? new Date(typedFirstLeg.pricing_period_end) : new Date(),
          unit: (typedFirstLeg.unit || 'MT') as Unit,
          paymentTerm: (typedFirstLeg.payment_term || '30 days') as PaymentTerm,
          creditStatus: (typedFirstLeg.credit_status || 'pending') as CreditStatus,
          formula: validateAndParsePricingFormula(typedFirstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(typedFirstLeg.mtm_formula),
          legs: legs.map(legItem => {
            const typedLeg = legItem as DbTradeLegWithEFP;
            
            return {
              id: typedLeg.id,
              parentTradeId: typedLeg.parent_trade_id,
              legReference: typedLeg.leg_reference,
              buySell: typedLeg.buy_sell as BuySell,
              product: typedLeg.product as Product,
              sustainability: typedLeg.sustainability || '',
              incoTerm: (typedLeg.inco_term || 'FOB') as IncoTerm,
              quantity: typedLeg.quantity,
              tolerance: typedLeg.tolerance || 0,
              loadingPeriodStart: typedLeg.loading_period_start ? new Date(typedLeg.loading_period_start) : new Date(),
              loadingPeriodEnd: typedLeg.loading_period_end ? new Date(typedLeg.loading_period_end) : new Date(),
              pricingPeriodStart: typedLeg.pricing_period_start ? new Date(typedLeg.pricing_period_start) : new Date(),
              pricingPeriodEnd: typedLeg.pricing_period_end ? new Date(typedLeg.pricing_period_end) : new Date(),
              unit: (typedLeg.unit || 'MT') as Unit,
              paymentTerm: (typedLeg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (typedLeg.credit_status || 'pending') as CreditStatus,
              formula: validateAndParsePricingFormula(typedLeg.pricing_formula),
              mtmFormula: validateAndParsePricingFormula(typedLeg.mtm_formula),
              efpPremium: typedLeg.efp_premium,
              efpAgreedStatus: typedLeg.efp_agreed_status,
              efpFixedValue: typedLeg.efp_fixed_value,
              efpDesignatedMonth: typedLeg.efp_designated_month
            };
          })
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
    console.error('[PHYSICAL] Error fetching trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = () => {
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  
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
      refetch
    );
  }, [refetch]);

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
