
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
  CustomsStatus,
  PricingType,
  ContractStatus,
  PhysicalTradeLeg,
  DbParentTrade,
  DbTradeLeg
} from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { setupPhysicalTradeSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';

const fetchTrades = async (): Promise<PhysicalTrade[]> => {
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

    const mappedTrades: PhysicalTrade[] = parentTrades.map((parent: DbParentTrade) => {
      const legs = tradeLegs.filter((leg: any) => leg.parent_trade_id === parent.id);
      
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === 'physical' && firstLeg) {
        const loadingPeriodStart = firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : new Date();
        const pricingPeriodStart = firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date();
        
        // Default end dates to start dates if they're missing
        const loadingPeriodEnd = firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : new Date(loadingPeriodStart);
        const pricingPeriodEnd = firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(pricingPeriodStart);
        
        const physicalTrade: PhysicalTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: 'physical' as TradeType, 
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
          loadingPeriodStart,
          loadingPeriodEnd,
          pricingPeriodStart,
          pricingPeriodEnd,
          unit: (firstLeg.unit || 'MT') as Unit,
          paymentTerm: (firstLeg.payment_term || '30 days') as PaymentTerm,
          creditStatus: (firstLeg.credit_status || 'pending') as CreditStatus,
          customsStatus: firstLeg.customs_status as CustomsStatus,
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula),
          pricingType: (firstLeg.pricing_type || 'standard') as PricingType,
          mtmFutureMonth: firstLeg.mtm_future_month,
          comments: firstLeg.comments,
          contractStatus: firstLeg.contract_status as ContractStatus,
          legs: legs.map(leg => {
            const legLoadingStart = leg.loading_period_start ? new Date(leg.loading_period_start) : new Date();
            const legPricingStart = leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date();
            
            // Default end dates to start dates if they're missing for legs
            const legLoadingEnd = leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(legLoadingStart);
            const legPricingEnd = leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(legPricingStart);
            
            return {
              id: leg.id,
              parentTradeId: leg.parent_trade_id,
              legReference: leg.leg_reference,
              buySell: leg.buy_sell as BuySell,
              product: leg.product as Product,
              sustainability: leg.sustainability || '',
              incoTerm: (leg.inco_term || 'FOB') as IncoTerm,
              quantity: leg.quantity,
              tolerance: leg.tolerance || 0,
              loadingPeriodStart: legLoadingStart,
              loadingPeriodEnd: legLoadingEnd,
              pricingPeriodStart: legPricingStart,
              pricingPeriodEnd: legPricingEnd,
              unit: (leg.unit || 'MT') as Unit,
              paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (leg.credit_status || 'pending') as CreditStatus,
              customsStatus: leg.customs_status as CustomsStatus,
              formula: validateAndParsePricingFormula(leg.pricing_formula),
              mtmFormula: validateAndParsePricingFormula(leg.mtm_formula),
              pricingType: (leg.pricing_type || 'standard') as PricingType,
              efpPremium: leg.efp_premium,
              efpAgreedStatus: leg.efp_agreed_status,
              efpFixedValue: leg.efp_fixed_value,
              efpDesignatedMonth: leg.efp_designated_month,
              mtmFutureMonth: leg.mtm_future_month,
              comments: leg.comments,
              contractStatus: leg.contract_status as ContractStatus
            } as PhysicalTradeLeg;
          })
        };
        return physicalTrade;
      } 
      
      // This branch should never execute with our filter, but TypeScript needs it
      return {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: 'physical' as TradeType,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        counterparty: parent.counterparty,
        buySell: 'buy' as BuySell,
        product: 'UCOME' as Product,
        quantity: 0,
        loadingPeriodStart: new Date(),
        loadingPeriodEnd: new Date(),
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
        legs: []
      } as PhysicalTrade;
    });

    return mappedTrades.filter(trade => trade.tradeType === 'physical');
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
