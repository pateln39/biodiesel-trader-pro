import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PaperTrade, PaperTradeLeg, PaperRelationshipType, BuySell } from '@/types/trade';
import { formatMonthCode } from '@/utils/dateUtils';

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  
  // Fetch paper trades
  const { data: paperTrades, isLoading, error } = useQuery({
    queryKey: ['paper-trades'],
    queryFn: async () => {
      // Fetch parent trades of type 'paper'
      const { data: parentTrades, error: parentError } = await supabase
        .from('parent_trades')
        .select(`
          id,
          trade_reference,
          counterparty,
          created_at,
          updated_at,
          comment
        `)
        .eq('trade_type', 'paper')
        .order('created_at', { ascending: false });
        
      if (parentError) {
        throw new Error(`Error fetching paper trades: ${parentError.message}`);
      }
      
      // For each parent trade, fetch its legs
      const tradesWithLegs = await Promise.all(
        (parentTrades || []).map(async (parentTrade) => {
          const { data: legs, error: legsError } = await supabase
            .from('trade_legs')
            .select('*')
            .eq('parent_trade_id', parentTrade.id);
            
          if (legsError) {
            throw new Error(`Error fetching trade legs: ${legsError.message}`);
          }
          
          return {
            id: parentTrade.id,
            tradeReference: parentTrade.trade_reference,
            tradeType: 'paper' as const,
            counterparty: parentTrade.counterparty || '',
            createdAt: new Date(parentTrade.created_at),
            updatedAt: new Date(parentTrade.updated_at),
            comment: parentTrade.comment,
            broker: legs && legs[0] ? legs[0].broker : '',
            legs: (legs || []).map((leg) => {
              // Parse the relationship_type from trading_period if available
              const relationshipType = leg.trading_period as PaperRelationshipType || 'FP';
              
              // Safely extract rightSide from mtm_formula if it exists
              let rightSide;
              if (leg.mtm_formula && 
                 typeof leg.mtm_formula === 'object' && 
                 'rightSide' in leg.mtm_formula) {
                rightSide = leg.mtm_formula.rightSide;
              }
              
              return {
                id: leg.id,
                parentTradeId: leg.parent_trade_id,
                legReference: leg.leg_reference,
                buySell: leg.buy_sell as BuySell,
                product: leg.product,
                quantity: leg.quantity,
                period: leg.trading_period || '', // Use trading_period for consistency
                price: leg.price || 0,
                broker: leg.broker,
                relationshipType,
                rightSide: rightSide,
                formula: leg.pricing_formula,
                mtmFormula: leg.mtm_formula
              };
            })
          };
        })
      );
      
      return tradesWithLegs as PaperTrade[];
    }
  });
  
  // Create paper trade mutation
  const { mutate: createPaperTrade, isPending: isCreating } = useMutation({
    mutationFn: async (trade: Partial<PaperTrade>) => {
      // Insert parent trade
      const { data: parentTrade, error: parentError } = await supabase
        .from('parent_trades')
        .insert({
          trade_reference: trade.tradeReference,
          trade_type: 'paper',
          comment: trade.comment,
          // Note: counterparty is not required for paper trades but the DB may require it
          // We'll use the broker name as a placeholder if needed
          counterparty: trade.broker || 'Paper Trade'
        })
        .select('id')
        .single();
        
      if (parentError) {
        throw new Error(`Error creating paper trade: ${parentError.message}`);
      }
      
      // Prepare legs for insertion
      if (trade.legs && trade.legs.length > 0) {
        // Insert trade legs one by one to ensure proper typing
        for (const leg of trade.legs) {
          // Store the period in both trading_period and pricing_period_start/end for consistency
          const tradingPeriod = leg.period;
          
          // If we have a proper date string in the period field, use it
          // Otherwise we'll just use the trading_period as is
          let pricingPeriodStart = null;
          let pricingPeriodEnd = null;
          
          if (tradingPeriod) {
            try {
              // Parse period like "Mar-24" into a date
              const [month, year] = tradingPeriod.split('-');
              const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                .findIndex(m => m === month);
              
              if (monthIndex !== -1) {
                const fullYear = 2000 + parseInt(year);
                
                // First day of month
                pricingPeriodStart = new Date(fullYear, monthIndex, 1).toISOString();
                
                // Last day of month
                const lastDay = new Date(fullYear, monthIndex + 1, 0).getDate();
                pricingPeriodEnd = new Date(fullYear, monthIndex, lastDay).toISOString();
              }
            } catch (e) {
              console.error('Error parsing period date:', e);
            }
          }
          
          // Ensure mtmFormula has the right structure with exposures
          let mtmFormula = leg.mtmFormula || {};
          
          // For DIFF trades, make sure we capture both sides in the exposures
          if (leg.relationshipType !== 'FP' && leg.rightSide) {
            // Store the rightSide separately in the mtmFormula for reference
            mtmFormula = {
              ...mtmFormula,
              rightSide: leg.rightSide,
              // Ensure we have proper physical exposures for both sides
              exposures: {
                physical: {
                  [leg.product]: leg.quantity || 0,
                  [leg.rightSide.product]: leg.rightSide.quantity || 0
                }
              }
            };
          }
          
          const legData = {
            leg_reference: leg.legReference,
            parent_trade_id: parentTrade.id,
            buy_sell: leg.buySell,
            product: leg.product,
            quantity: leg.quantity,
            price: leg.price,
            broker: leg.broker || trade.broker,
            trading_period: tradingPeriod, // Store period code in trading_period
            pricing_formula: leg.formula,
            mtm_formula: mtmFormula,
            pricing_period_start: pricingPeriodStart,
            pricing_period_end: pricingPeriodEnd
          };
          
          const { error: legError } = await supabase
            .from('trade_legs')
            .insert(legData);
            
          if (legError) {
            throw new Error(`Error creating trade leg: ${legError.message}`);
          }
        }
      }
      
      return { ...trade, id: parentTrade.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
      toast.success('Paper trade created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
    }
  });
  
  return {
    paperTrades,
    isLoading,
    error,
    createPaperTrade,
    isCreating
  };
};
