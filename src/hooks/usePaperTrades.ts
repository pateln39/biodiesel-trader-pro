import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BuySell, Product } from '@/types/trade';
import { PaperTrade, PaperTradeLeg, PaperRelationshipType } from '@/types/paper';
import { formatMonthCode } from '@/utils/dateUtils';
import { 
  generateLegReference, 
  formatProductDisplay, 
  formatMTMDisplay,
  generateInstrumentName 
} from '@/utils/tradeUtils';
import { deletePaperTrade } from '@/utils/paperTradeDeleteUtils';
import { cleanupSubscriptions, delay, pauseSubscriptions, resumeSubscriptions } from '@/utils/subscriptionUtils';

// Debounce function to prevent multiple refetches in quick succession
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  // Debounced refetch function with additional safeguard
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("Skipping paper trade refetch as deletion is in progress");
      return;
    }
    console.log("Executing debounced paper trade refetch");
    fn();
  }, 500)).current;
  
  // Fetch paper trades from new tables only
  const { data: paperTrades, isLoading, error, refetch } = useQuery({
    queryKey: ['paper-trades'],
    queryFn: fetchNewPaperTrades,
    staleTime: 2000, // Consider data stale after 2 seconds
    refetchOnWindowFocus: false // Disable automatic refetch on window focus
  });
  
  // Fetch new paper trades from paper_trades/paper_trade_legs tables
  async function fetchNewPaperTrades(): Promise<PaperTrade[]> {
    // Fetch from new paper_trades table
    const { data: paperTradesData, error: paperTradesError } = await supabase
      .from('paper_trades')
      .select(`
        id,
        trade_reference,
        counterparty,
        broker,
        comment,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (paperTradesError) {
      console.error('Error fetching paper trades:', paperTradesError.message);
      throw paperTradesError;
    }
    
    if (!paperTradesData || paperTradesData.length === 0) {
      return [];
    }
    
    console.log(`Found ${paperTradesData.length} paper trades`);
    
    // For each paper trade, fetch its legs
    const tradesWithLegs = await Promise.all(
      paperTradesData.map(async (paperTrade) => {
        const { data: legs, error: legsError } = await supabase
          .from('paper_trade_legs')
          .select('*')
          .eq('paper_trade_id', paperTrade.id)
          .order('leg_reference', { ascending: true });
          
        if (legsError) {
          console.error('Error fetching paper trade legs:', legsError.message);
          return {
            id: paperTrade.id,
            tradeReference: paperTrade.trade_reference,
            tradeType: 'paper' as const,
            counterparty: paperTrade.counterparty,
            broker: paperTrade.broker || '',
            createdAt: new Date(paperTrade.created_at),
            updatedAt: new Date(paperTrade.updated_at),
            comment: paperTrade.comment,
            legs: []
          };
        }
        
        return {
          id: paperTrade.id,
          tradeReference: paperTrade.trade_reference,
          tradeType: 'paper' as const,
          counterparty: paperTrade.counterparty,
          broker: paperTrade.broker || '',
          createdAt: new Date(paperTrade.created_at),
          updatedAt: new Date(paperTrade.updated_at),
          comment: paperTrade.comment,
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
            
            // Process exposures with type safety
            let exposuresObj: PaperTradeLeg['exposures'] = {
              physical: {},
              pricing: {},
              paper: {}
            };
            
            if (leg.exposures) {
              // Handle exposures from the dedicated column
              if (typeof leg.exposures === 'object') {
                // Safely access nested properties with type checking
                const exposuresData = leg.exposures as Record<string, any>;
                
                if (exposuresData.physical && typeof exposuresData.physical === 'object') {
                  exposuresObj.physical = exposuresData.physical as Record<string, number>;
                }
                
                if (exposuresData.paper && typeof exposuresData.paper === 'object') {
                  exposuresObj.paper = exposuresData.paper as Record<string, number>;
                }
                
                if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
                  exposuresObj.pricing = exposuresData.pricing as Record<string, number>;
                }
              }
            } else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
              // Fallback to mtm_formula for legacy compatibility
              const mtmData = leg.mtm_formula as Record<string, any>;
              
              if (mtmData.exposures && typeof mtmData.exposures === 'object') {
                const mtmExposures = mtmData.exposures as Record<string, any>;
                
                if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
                  exposuresObj.physical = mtmExposures.physical as Record<string, number>;
                  exposuresObj.paper = mtmExposures.physical as Record<string, number>;  // For backward compatibility
                }
                
                if (mtmExposures.pricing && typeof mtmExposures.pricing === 'object') {
                  exposuresObj.pricing = mtmExposures.pricing as Record<string, number>;
                }
              }
            }
            
            return {
              id: leg.id,
              paperTradeId: leg.paper_trade_id,
              legReference: leg.leg_reference,
              buySell: leg.buy_sell as BuySell,
              product: leg.product as Product,
              quantity: leg.quantity,
              period: leg.period || leg.trading_period || '', 
              price: leg.price || 0,
              broker: leg.broker,
              instrument: leg.instrument,
              relationshipType,
              rightSide: rightSide,
              formula: leg.formula,
              mtmFormula: leg.mtm_formula,
              exposures: exposuresObj
            };
          })
        };
      })
    );
    
    return tradesWithLegs;
  };
  
  // Setup and cleanup function for realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    // First clean up any existing subscriptions
    cleanupSubscriptions(realtimeChannelsRef.current);
    
    // Subscribe to changes on new paper_trades table
    const paperTradesChannel = supabase
      .channel('paper_trades')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'paper_trades'
      }, (payload) => {
        // Skip if we're in the middle of a deletion
        if (realtimeChannelsRef.current.paperTradesChannel?.isPaused) {
          console.log('Subscription paused, skipping update for paper_trades');
          return;
        }
        
        if (!isProcessingRef.current) {
          console.log('Paper trades changed, debouncing refetch...', payload);
          debouncedRefetch(refetch);
        }
      })
      .subscribe();

    realtimeChannelsRef.current.paperTradesChannel = paperTradesChannel;

    // Subscribe to changes on new paper_trade_legs table
    const paperTradeLegsChannel = supabase
      .channel('paper_trade_legs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'paper_trade_legs' 
      }, (payload) => {
        // Skip if we're in the middle of a deletion
        if (realtimeChannelsRef.current.paperTradeLegsChannel?.isPaused) {
          console.log('Subscription paused, skipping update for paper_trade_legs');
          return;
        }
        
        if (!isProcessingRef.current) {
          console.log('Paper trade legs changed, debouncing refetch...', payload);
          debouncedRefetch(refetch);
        }
      })
      .subscribe();

    realtimeChannelsRef.current.paperTradeLegsChannel = paperTradeLegsChannel;
  }, [refetch, debouncedRefetch]);
  
  // Set up real-time subscription with improved cleanup
  useEffect(() => {
    setupRealtimeSubscriptions();
    
    // Cleanup subscriptions on unmount
    return () => {
      cleanupSubscriptions(realtimeChannelsRef.current);
    };
  }, [setupRealtimeSubscriptions]);
  
  // Mutation for deleting a paper trade with improved error handling
  const deletePaperTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      try {
        // Mark as processing to prevent concurrent operations and realtime updates
        isProcessingRef.current = true;
        console.log("Setting isProcessing to true for deletePaperTrade");
        
        // Pause realtime subscriptions during deletion instead of removing them
        pauseSubscriptions(realtimeChannelsRef.current);
        
        // First update UI optimistically
        queryClient.setQueryData(['paper-trades'], (oldData: any) => {
          // Filter out the deleted trade
          return oldData.filter((trade: any) => trade.id !== tradeId);
        });
        
        // Then perform actual deletion
        const success = await deletePaperTrade(tradeId);
        
        // Wait a little bit before refetching to allow database operations to complete
        await delay(800);
        
        return { success, tradeId };
      } catch (error) {
        console.error("Error in deletePaperTradeMutation:", error);
        throw error;
      } finally {
        // Resume subscriptions instead of recreating them
        resumeSubscriptions(realtimeChannelsRef.current);
        
        // Reset processing flag
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("Setting isProcessing to false for deletePaperTrade");
        }, 500);
      }
    },
    onSuccess: (data) => {
      // Only show success message after deletion completes
      if (data.success) {
        toast.success("Paper trade deleted successfully");
      }
      
      // Invalidate affected queries after a longer delay to avoid UI freezing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
      }, 800);
    },
    onError: (error) => {
      toast.error("Failed to delete paper trade", { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Refetch to make sure UI is consistent with database
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      }, 800);
    }
  });
  
  // Create paper trade mutation - updated to use new tables and store exposures separately
  const { mutate: createPaperTrade, isPending: isCreating } = useMutation({
    mutationFn: async (trade: Partial<PaperTrade>) => {
      // Insert paper trade to new paper_trades table
      const { data: paperTrade, error: paperTradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: trade.tradeReference,
          counterparty: trade.broker || 'Paper Trade',
          broker: trade.broker,
          comment: trade.comment || ''
        })
        .select('id')
        .single();
        
      if (paperTradeError) {
        throw new Error(`Error creating paper trade: ${paperTradeError.message}`);
      }
      
      // Prepare legs for insertion
      if (trade.legs && trade.legs.length > 0) {
        // Insert trade legs one by one
        for (let i = 0; i < trade.legs.length; i++) {
          const leg = trade.legs[i];
          // Generate leg reference with alphabetical suffix
          const legReference = generateLegReference(trade.tradeReference || '', i);
          
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
          
          // Create separate exposures object for database
          const exposures = {
            physical: {},
            paper: {},
            pricing: {}
          };
          
          // Add exposures based on leg type
          if (leg.relationshipType === 'FP') {
            // For FP, just the main product
            exposures.physical[leg.product] = leg.quantity || 0;
            exposures.paper[leg.product] = leg.quantity || 0;
          } else if (leg.rightSide) {
            // For DIFF/SPREAD with right side
            exposures.physical[leg.product] = leg.quantity || 0;
            exposures.physical[leg.rightSide.product] = leg.rightSide.quantity || 0;
            exposures.paper[leg.product] = leg.quantity || 0;
            exposures.paper[leg.rightSide.product] = leg.rightSide.quantity || 0;
          }
          
          // Generate the instrument name
          const instrument = generateInstrumentName(
            leg.product, 
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          // Prepare mtmFormula for database (convert from TypeScript to JSON)
          let mtmFormulaForDb = null;
          if (leg.mtmFormula && typeof leg.mtmFormula === 'object') {
            // Make sure it's proper JSON
            mtmFormulaForDb = JSON.parse(JSON.stringify(leg.mtmFormula));
          }
          
          // Prepare formula for database (convert from TypeScript to JSON)
          let formulaForDb = null;
          if (leg.formula && typeof leg.formula === 'object') {
            // Make sure it's proper JSON
            formulaForDb = JSON.parse(JSON.stringify(leg.formula));
          }
          
          const legData = {
            leg_reference: legReference,
            paper_trade_id: paperTrade.id,
            buy_sell: leg.buySell,
            product: leg.product,
            quantity: leg.quantity,
            price: leg.price,
            broker: leg.broker || trade.broker,
            period: tradingPeriod,
            trading_period: tradingPeriod,
            formula: formulaForDb,
            mtm_formula: mtmFormulaForDb,
            pricing_period_start: pricingPeriodStart,
            pricing_period_end: pricingPeriodEnd,
            instrument: instrument,
            // Store exposures separately - convert to proper JSON
            exposures: JSON.parse(JSON.stringify(exposures))
          };
          
          const { error: legError } = await supabase
            .from('paper_trade_legs')
            .insert(legData);
            
          if (legError) {
            throw new Error(`Error creating trade leg: ${legError.message}`);
          }
        }
      }
      
      return { ...trade, id: paperTrade.id };
    },
    onSuccess: () => {
      // Use a delay before invalidating queries
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
        toast.success('Paper trade created successfully');
      }, 500);
    },
    onError: (error: Error) => {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
    }
  });
  
  return {
    paperTrades: paperTrades || [],
    isLoading,
    error,
    createPaperTrade,
    isCreating,
    refetchPaperTrades: refetch,
    deletePaperTrade: deletePaperTradeMutation.mutate,
    isDeletePaperTradeLoading: deletePaperTradeMutation.isPending
  };
};
