
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { validateAndParsePhysicalFormula } from '@/utils/physicalFormulaUtils';

export const useTrades = () => {
  const queryClient = useQueryClient();
  
  // Query for fetching trades
  const { data: physicalTrades = [], isLoading, error, refetch } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      // Get the physical trades
      const { data: physicalTradesData, error: physicalTradesError } = await supabase
        .from('physical_trades') // Changed from parent_trades
        .select('*')
        .eq('trade_type', 'physical')
        .order('created_at', { ascending: false });
        
      if (physicalTradesError) {
        throw new Error(`Error fetching physical trades: ${physicalTradesError.message}`);
      }
      
      // Get all physical trade legs
      const { data: physicalTradeLegsData, error: physicalTradeLegsError } = await supabase
        .from('physical_trade_legs') // Changed from trade_legs
        .select('*')
        .order('created_at', { ascending: true });
        
      if (physicalTradeLegsError) {
        throw new Error(`Error fetching physical trade legs: ${physicalTradeLegsError.message}`);
      }
      
      // Map physical trades to our model
      const mappedPhysicalTrades: PhysicalTrade[] = physicalTradesData.map(trade => {
        // Find all legs for this trade
        const tradeLegs = physicalTradeLegsData.filter(leg => leg.parent_trade_id === trade.id);
        
        if (tradeLegs.length === 0) {
          console.warn(`No legs found for physical trade ${trade.id}`);
        }
        
        // Default to the first leg for single-leg display in the trades table
        const defaultLeg = tradeLegs[0] || {};
        
        // For backward compatibility, take values from the first leg
        return {
          id: trade.id,
          tradeReference: trade.trade_reference,
          tradeType: 'physical',
          physicalType: trade.physical_type || 'spot',
          createdAt: new Date(trade.created_at),
          updatedAt: new Date(trade.updated_at),
          counterparty: trade.counterparty,
          buySell: defaultLeg.buy_sell || 'buy',
          product: defaultLeg.product || 'UCOME',
          sustainability: defaultLeg.sustainability || '',
          incoTerm: defaultLeg.inco_term || 'FOB',
          quantity: defaultLeg.quantity || 0,
          tolerance: defaultLeg.tolerance || 0,
          loadingPeriodStart: defaultLeg.loading_period_start ? new Date(defaultLeg.loading_period_start) : new Date(),
          loadingPeriodEnd: defaultLeg.loading_period_end ? new Date(defaultLeg.loading_period_end) : new Date(),
          pricingPeriodStart: defaultLeg.pricing_period_start ? new Date(defaultLeg.pricing_period_start) : new Date(),
          pricingPeriodEnd: defaultLeg.pricing_period_end ? new Date(defaultLeg.pricing_period_end) : new Date(),
          unit: defaultLeg.unit || 'MT',
          paymentTerm: defaultLeg.payment_term || '30 days',
          creditStatus: defaultLeg.credit_status || 'pending',
          formula: validateAndParsePhysicalFormula(defaultLeg.pricing_formula),
          mtmFormula: validateAndParsePhysicalFormula(defaultLeg.mtm_formula),
          
          // Map all legs
          legs: tradeLegs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell,
            product: leg.product,
            sustainability: leg.sustainability || '',
            incoTerm: leg.inco_term,
            quantity: leg.quantity,
            tolerance: leg.tolerance || 0,
            loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
            loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
            pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
            unit: leg.unit,
            paymentTerm: leg.payment_term,
            creditStatus: leg.credit_status,
            formula: validateAndParsePhysicalFormula(leg.pricing_formula),
            mtmFormula: validateAndParsePhysicalFormula(leg.mtm_formula)
          } as PhysicalTradeLeg))
        } as PhysicalTrade;
      });
      
      return mappedPhysicalTrades;
    }
  });
  
  const deleteTrade = async (tradeId: string): Promise<void> => {
    try {
      // Delete from physical_trades (renamed from parent_trades)
      // The cascade will handle deleting the legs
      const { error } = await supabase
        .from('physical_trades')
        .delete()
        .eq('id', tradeId);
        
      if (error) {
        throw new Error(`Error deleting trade: ${error.message}`);
      }
      
      // Invalidate the trades query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error deleting trade:', error);
      return Promise.reject(error);
    }
  };
  
  const refetchTrades = useCallback(async () => {
    return refetch();
  }, [refetch]);
  
  return {
    trades: physicalTrades,
    loading: isLoading,
    error,
    deleteTrade,
    refetchTrades
  };
};
