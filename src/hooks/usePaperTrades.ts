import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PaperTrade, PaperTradeLeg, PaperRelationshipType, BuySell, Product } from '@/types/trade';
import { formatMonthCode } from '@/utils/dateUtils';
import { 
  generateLegReference, 
  formatProductDisplay, 
  formatMTMDisplay,
  generateInstrumentName 
} from '@/utils/tradeUtils';

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  const supabaseChannels = useRef<ReturnType<typeof supabase.channel>[]>([]);
  
  // Track if we already have active subscriptions to avoid duplicates
  const hasSetupSubscriptions = useRef(false);
  
  // Track if a refetch is already in progress
  const refetchInProgress = useRef(false);
  
  // Fetch paper trades
  const { 
    data: paperTrades = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['paper-trades'],
    queryFn: async () => {
      // Set refetch flag to prevent duplicate refetches
      refetchInProgress.current = true;
      
      try {
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
              .eq('parent_trade_id', parentTrade.id)
              .order('leg_reference', { ascending: true });
              
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
                // Extract the relationship_type from instrument
                const instrument = leg.instrument || '';
                let relationshipType: PaperRelationshipType = 'FP';
                
                if (instrument.includes('DIFF')) {
                  relationshipType = 'DIFF';
                } else if (instrument.includes('SPREAD')) {
                  relationshipType = 'SPREAD';
                }
                
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
                  product: leg.product as Product,
                  quantity: leg.quantity,
                  period: leg.trading_period || '', 
                  price: leg.price || 0,
                  broker: leg.broker,
                  instrument: leg.instrument,
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
      } finally {
        // Clear refetch flag after a short delay
        setTimeout(() => {
          refetchInProgress.current = false;
        }, 500);
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000, // Increase stale time to reduce refetches
    refetchInterval: 60000, // Reduce refetch interval to once per minute
  });
  
  // Controlled refetch function to prevent multiple simultaneous refetches
  const safeRefetch = useCallback(() => {
    if (refetchInProgress.current) {
      console.log('Refetch already in progress, skipping...');
      return Promise.resolve();
    }
    
    console.log('Executing safe refetch for paper trades');
    return refetch();
  }, [refetch]);
  
  // Set up real-time subscription to paper trades changes
  useEffect(() => {
    // Only set up subscriptions once
    if (hasSetupSubscriptions.current) {
      return;
    }
    
    hasSetupSubscriptions.current = true;
    console.log('Setting up paper trades realtime subscriptions');
    
    // Subscribe to changes on parent_trades table for paper trades
    const parentTradesChannel = supabase
      .channel('paper:parent_trades')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parent_trades',
        filter: 'trade_type=eq.paper'
      }, (payload) => {
        console.log('Paper trades changed:', payload);
        
        // Use debounced refetch to prevent rapid multiple refetches
        if (!refetchInProgress.current) {
          const timer = setTimeout(() => {
            safeRefetch();
          }, 300);
          
          return () => clearTimeout(timer);
        }
      })
      .subscribe();

    // Subscribe to changes on trade_legs table related to paper trades
    const tradeLegsChannel = supabase
      .channel('paper:trade_legs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_legs' 
      }, (payload) => {
        console.log('Trade legs changed:', payload);
        
        // Use debounced refetch to prevent rapid multiple refetches
        if (!refetchInProgress.current) {
          const timer = setTimeout(() => {
            safeRefetch();
          }, 300);
          
          return () => clearTimeout(timer);
        }
      })
      .subscribe();

    // Store channels for cleanup
    supabaseChannels.current = [parentTradesChannel, tradeLegsChannel];

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up paper trades realtime subscriptions');
      supabaseChannels.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      hasSetupSubscriptions.current = false;
    };
  }, [safeRefetch]);

  // Create paper trade mutation
  const { mutate: createPaperTrade, isPending: isCreating } = useMutation({
    mutationFn: async (trade: Partial<PaperTrade>) => {
      // Store the original product selection in the comment field for reference
      let comment = trade.comment || '';
      
      // Insert parent trade - store the product info in the comment
      const { data: parentTrade, error: parentError } = await supabase
        .from('parent_trades')
        .insert({
          trade_reference: trade.tradeReference,
          trade_type: 'paper',
          comment: comment,
          // Use the broker name as a placeholder if needed
          counterparty: trade.broker || 'Paper Trade'
        })
        .select('id')
        .single();
        
      if (parentError) {
        throw new Error(`Error creating paper trade: ${parentError.message}`);
      }
      
      // Prepare legs for insertion
      if (trade.legs && trade.legs.length > 0) {
        // Insert trade legs one by one
        for (let i = 0; i < trade.legs.length; i++) {
          const leg = trade.legs[i];
          // Generate leg reference with alphabetical suffix
          const legReference = generateLegReference(trade.tradeReference || '', i);
          
          // Store the period in both trading_period and pricing_period_start/end for consistency
          const tradingPeriod = leg.period;
          
          // Parse period if available
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
          
          // Prepare mtmFormula with rightSide info
          let mtmFormula = leg.mtmFormula || {};
          
          // For DIFF/SPREAD trades, capture both sides in the exposures
          if (leg.relationshipType !== 'FP' && leg.rightSide) {
            mtmFormula = {
              ...mtmFormula,
              rightSide: leg.rightSide,
              exposures: {
                physical: {
                  [leg.product]: leg.quantity || 0,
                  [leg.rightSide.product]: leg.rightSide.quantity || 0
                }
              }
            };
          }
          
          // Generate the instrument name (for database storage - MTM format)
          const instrument = generateInstrumentName(
            leg.product, 
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          const legData = {
            leg_reference: legReference,
            parent_trade_id: parentTrade.id,
            buy_sell: leg.buySell,
            product: leg.product,
            quantity: leg.quantity,
            price: leg.price,
            broker: leg.broker || trade.broker,
            trading_period: tradingPeriod,
            pricing_formula: leg.formula,
            mtm_formula: mtmFormula,
            pricing_period_start: pricingPeriodStart,
            pricing_period_end: pricingPeriodEnd,
            instrument: instrument
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
    isCreating,
    refetchPaperTrades: safeRefetch // Export safe refetch function for consistency with useTrades
  };
};
