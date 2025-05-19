
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
import { PaginationParams, PaginatedResponse } from '@/types/pagination';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { setupPhysicalTradeSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';

const fetchTrades = async (params: PaginationParams = { page: 1, pageSize: 15 }): Promise<PaginatedResponse<PhysicalTrade>> => {
  try {
    // Step 1: Get parent trade IDs for physical trades
    const { data: parentTradesData, error: parentTradeError } = await supabase
      .from('parent_trades')
      .select('id')
      .eq('trade_type', 'physical');
      
    if (parentTradeError) {
      throw new Error(`Error fetching parent trades: ${parentTradeError.message}`);
    }
    
    // Extract just the IDs into an array
    const physicalTradeIds = parentTradesData.map(pt => pt.id);
    
    // Step 2: Count the total number of legs for pagination metadata
    const { count: totalLegsCount, error: countError } = await supabase
      .from('trade_legs')
      .select('*', { count: 'exact', head: false })
      .in('parent_trade_id', physicalTradeIds);
      
    if (countError) {
      throw new Error(`Error counting trade legs: ${countError.message}`);
    }
    
    // Calculate range for pagination
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    
    // Step 3: Fetch paginated legs
    const { data: tradeLegs, error: tradeLegsError } = await supabase
      .from('trade_legs')
      .select('*, parent_trade_id')
      .in('parent_trade_id', physicalTradeIds)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (tradeLegsError) {
      throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
    }

    // If no trade legs, return empty result with pagination metadata
    if (!tradeLegs || tradeLegs.length === 0) {
      return {
        data: [],
        meta: {
          totalItems: totalLegsCount || 0,
          totalPages: Math.ceil((totalLegsCount || 0) / params.pageSize),
          currentPage: params.page,
          pageSize: params.pageSize
        }
      };
    }

    // Step 4: Get all parent trade IDs from the fetched legs
    const legParentIds = [...new Set(tradeLegs.map(leg => leg.parent_trade_id))];

    // Step 5: Fetch all parent trades for the current page of legs
    const { data: parentTrades, error: parentTradesError } = await supabase
      .from('parent_trades')
      .select('*')
      .in('id', legParentIds)
      .eq('trade_type', 'physical');

    if (parentTradesError) {
      throw new Error(`Error fetching parent trades: ${parentTradesError.message}`);
    }

    // Step 6: Map the data to our application model
    // Create a map of parent trades for faster lookup
    const parentTradeMap = new Map();
    parentTrades.forEach((parent: DbParentTrade) => {
      parentTradeMap.set(parent.id, parent);
    });

    // Group legs by parent trade
    const tradesByParentId = new Map();
    
    tradeLegs.forEach((leg: any) => {
      const parentTradeId = leg.parent_trade_id;
      
      if (!tradesByParentId.has(parentTradeId)) {
        tradesByParentId.set(parentTradeId, []);
      }
      
      tradesByParentId.get(parentTradeId).push(leg);
    });
    
    // Map to PhysicalTrade objects
    const mappedTrades: PhysicalTrade[] = Array.from(tradesByParentId.entries()).map(([parentTradeId, legs]) => {
      const parent = parentTradeMap.get(parentTradeId);
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent && firstLeg) {
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
          legs: legs.map((leg: any) => {
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
      return null;
    }).filter(Boolean) as PhysicalTrade[];

    return {
      data: mappedTrades,
      meta: {
        totalItems: totalLegsCount || 0,
        totalPages: Math.ceil((totalLegsCount || 0) / params.pageSize),
        currentPage: params.page,
        pageSize: params.pageSize
      }
    };
  } catch (error: any) {
    console.error('[PHYSICAL] Error fetching trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = (paginationParams: PaginationParams = { page: 1, pageSize: 15 }) => {
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  
  const { 
    data, 
    isLoading: loading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['trades', paginationParams.page, paginationParams.pageSize],
    queryFn: () => fetchTrades(paginationParams),
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
    trades: data?.data || [], 
    pagination: data?.meta || {
      totalItems: 0,
      totalPages: 1,
      currentPage: paginationParams.page,
      pageSize: paginationParams.pageSize
    },
    loading, 
    error, 
    refetchTrades: refetch
  };
};
