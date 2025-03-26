
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
import { distributeQuantityByWorkingDays, distributeQuantityByDays } from '@/utils/workingDaysUtils';

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
        // Create the base physical trade structure
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
          legs: legs.map(leg => {
            // Process each leg with its formula and ensure the pricing periods are set correctly
            const pricingStart = leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date();
            const pricingEnd = leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date();
            
            // Parse the formula ensuring it has the correct exposure information
            const formula = validateAndParsePricingFormula(leg.pricing_formula);
            const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
            
            // Add daily distributions if they don't exist yet
            if (pricingStart && pricingEnd) {
              // Check and generate daily distributions for physical exposure
              if (mtmFormula.exposures && mtmFormula.exposures.physical && 
                  Object.keys(mtmFormula.exposures.physical).length > 0 && 
                  (!mtmFormula.exposures.dailyDistribution || 
                   Object.keys(mtmFormula.exposures.dailyDistribution).length === 0)) {
                
                mtmFormula.exposures.dailyDistribution = {};
                
                Object.entries(mtmFormula.exposures.physical).forEach(([instrument, weight]) => {
                  const quantity = typeof weight === 'number' ? Math.abs(weight) : 0;
                  if (quantity > 0) {
                    const direction = (typeof weight === 'number' && weight > 0) ? 1 : -1;
                    const dailyDist = distributeQuantityByDays(pricingStart, pricingEnd, quantity);
                    
                    mtmFormula.exposures.dailyDistribution![instrument] = {};
                    Object.entries(dailyDist).forEach(([day, amount]) => {
                      mtmFormula.exposures.dailyDistribution![instrument][day] = amount * direction;
                    });
                  }
                });
              }
              
              // Check and generate daily distributions for pricing exposure
              if (formula.exposures && formula.exposures.pricing && 
                  Object.keys(formula.exposures.pricing).length > 0 && 
                  (!formula.exposures.dailyDistribution || 
                   Object.keys(formula.exposures.dailyDistribution).length === 0)) {
                
                formula.exposures.dailyDistribution = {};
                
                Object.entries(formula.exposures.pricing).forEach(([instrument, weight]) => {
                  const quantity = typeof weight === 'number' ? Math.abs(weight) : 0;
                  if (quantity > 0) {
                    const direction = (typeof weight === 'number' && weight > 0) ? 1 : -1;
                    const dailyDist = distributeQuantityByDays(pricingStart, pricingEnd, quantity);
                    
                    formula.exposures.dailyDistribution![instrument] = {};
                    Object.entries(dailyDist).forEach(([day, amount]) => {
                      formula.exposures.dailyDistribution![instrument][day] = amount * direction;
                    });
                  }
                });
              }
            }
            
            // Return the processed leg
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
              pricingPeriodStart: pricingStart,
              pricingPeriodEnd: pricingEnd,
              unit: (leg.unit || 'MT') as Unit,
              paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (leg.credit_status || 'pending') as CreditStatus,
              formula: formula,
              mtmFormula: mtmFormula
            };
          })
        };
        return physicalTrade;
      } 
      
      // Handle non-physical trades (as before)
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
