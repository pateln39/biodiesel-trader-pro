
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
import { formatMonthKey, calculateProRatedExposure } from '@/utils/businessDayUtils';

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
        // Handle pricing period for exposure calculations
        const pricingStart = firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date();
        const pricingEnd = firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date();
        
        // Calculate exposures per month based on business days or use stored value
        let exposureByMonth: Record<string, number> = {};
        
        // First, check if we have stored exposures in the database
        if (firstLeg.exposures && firstLeg.exposures.byMonth) {
          console.log(`Using stored exposure data for trade ${parent.trade_reference}:`, firstLeg.exposures.byMonth);
          exposureByMonth = firstLeg.exposures.byMonth;
        } else {
          // If not, calculate them
          const quantity = firstLeg.quantity || 0;
          const buySell = firstLeg.buy_sell as BuySell;
          const exposureMultiplier = buySell === 'buy' ? 1 : -1;
          const totalExposure = quantity * exposureMultiplier;
          
          console.log(`Trade ${parent.trade_reference} - Calculating exposure: ${quantity} * ${exposureMultiplier} = ${totalExposure}`);
          console.log(`Pricing period: ${pricingStart.toDateString()} to ${pricingEnd.toDateString()}`);
          
          // Use business day utility to prorate exposure
          exposureByMonth = calculateProRatedExposure(pricingStart, pricingEnd, totalExposure);
          console.log('Calculated exposure by month:', exposureByMonth);
        }
        
        // Get the trading period from the database or fallback to calculating it
        const tradingPeriod = firstLeg.trading_period || formatMonthKey(pricingStart);
        console.log(`Using trading period: ${tradingPeriod}`);

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
          pricingPeriodStart: pricingStart,
          pricingPeriodEnd: pricingEnd,
          unit: (firstLeg.unit || 'MT') as Unit,
          paymentTerm: (firstLeg.payment_term || '30 days') as PaymentTerm,
          creditStatus: (firstLeg.credit_status || 'pending') as CreditStatus,
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula),
          // Store exposures by month
          exposureByMonth: exposureByMonth,
          // Store trading period
          tradingPeriod: tradingPeriod,
          legs: legs.map(leg => {
            const legPricingStart = leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date();
            const legPricingEnd = leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date();
            
            // Get leg-specific exposure data
            let legExposureByMonth: Record<string, number> = {};
            
            // First check if we have stored exposures
            if (leg.exposures && leg.exposures.byMonth) {
              legExposureByMonth = leg.exposures.byMonth;
            } else {
              // If not, calculate them
              const legBuySell = leg.buy_sell as BuySell;
              const legExposureMultiplier = legBuySell === 'buy' ? 1 : -1;
              const legTotalExposure = (leg.quantity || 0) * legExposureMultiplier;
              
              // Calculate per-leg exposures
              legExposureByMonth = calculateProRatedExposure(legPricingStart, legPricingEnd, legTotalExposure);
            }
            
            // Get the trading period from the database or calculate it
            const legTradingPeriod = leg.trading_period || formatMonthKey(legPricingStart);
            
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
              loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
              loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
              pricingPeriodStart: legPricingStart,
              pricingPeriodEnd: legPricingEnd,
              unit: (leg.unit || 'MT') as Unit,
              paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (leg.credit_status || 'pending') as CreditStatus,
              formula: validateAndParsePricingFormula(leg.pricing_formula),
              mtmFormula: validateAndParsePricingFormula(leg.mtm_formula),
              exposureByMonth: legExposureByMonth,
              tradingPeriod: legTradingPeriod,
            }
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
