
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getMonthDates, formatDateForDatabase, buildCompleteExposuresObject } from '@/utils/paperTrade';

export const usePaperTrades = () => {
  const queryClient = useQueryClient();

  // Fetch paper trades with legs
  const { data: paperTrades = [], isLoading, error, refetch: refetchPaperTrades } = useQuery({
    queryKey: ['paperTrades'],
    queryFn: async () => {
      const { data: trades, error: tradesError } = await supabase
        .from('paper_trades')
        .select(`
          *,
          legs:paper_trade_legs(*)
        `)
        .order('created_at', { ascending: false });

      if (tradesError) {
        throw new Error(`Error fetching paper trades: ${tradesError.message}`);
      }

      // Process the data to match the expected format
      return trades.map(trade => ({
        ...trade,
        legs: trade.legs.map((leg: any) => {
          // Parse mtm_formula if it exists and has rightSide
          let rightSide = null;
          if (leg.mtm_formula && leg.mtm_formula.rightSide) {
            rightSide = leg.mtm_formula.rightSide;
          }

          // Determine relationship type from instrument
          let relationshipType = 'FP';
          if (leg.instrument && leg.instrument.includes('DIFF')) {
            relationshipType = 'DIFF';
          } else if (leg.instrument && leg.instrument.includes('SPREAD')) {
            relationshipType = 'SPREAD';
          }

          return {
            id: leg.id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell,
            product: leg.product,
            quantity: leg.quantity,
            period: leg.period,
            price: leg.price,
            broker: leg.broker,
            instrument: leg.instrument,
            relationshipType,
            rightSide,
            formula: leg.formula,
            mtmFormula: leg.mtm_formula,
            exposures: leg.exposures,
            executionTradeDate: leg.execution_trade_date
          };
        })
      }));
    },
  });

  // Create paper trade mutation
  const createPaperTrade = useMutation({
    mutationFn: async (tradeData: any) => {
      console.log('[PAPER_TRADES] Creating paper trade with data:', tradeData);
      
      // 1. Create the parent paper trade
      const { data: paperTrade, error: paperTradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: tradeData.tradeReference,
          broker: tradeData.broker,
          counterparty: tradeData.counterparty || 'Market'
        })
        .select()
        .single();
        
      if (paperTradeError) {
        throw new Error(`Error creating paper trade: ${paperTradeError.message}`);
      }
      
      // 2. Create the paper trade legs
      for (const leg of tradeData.legs) {
        // Create properly structured mtmFormula with rightSide if needed
        let mtmFormula = leg.mtmFormula || {};
        if (leg.rightSide && leg.relationshipType !== 'FP') {
          mtmFormula.rightSide = leg.rightSide;
        }
        
        // Build a complete, correctly normalized exposures object using our fixed function
        let exposures = buildCompleteExposuresObject(leg);
        
        let pricingPeriodStart = null;
        let pricingPeriodEnd = null;
        
        if (leg.period) {
          try {
            // Get the dates using our utility function
            const dates = getMonthDates(leg.period);
            
            if (dates) {
              // Format dates for database storage without timezone issues
              pricingPeriodStart = formatDateForDatabase(dates.startDate);
              pricingPeriodEnd = formatDateForDatabase(dates.endDate);
            }
          } catch (e) {
            console.error('Error parsing period date:', e);
          }
        }
        
        console.log('[PAPER_TRADES] Creating leg with exposures:', exposures);
        
        // Create each leg
        const legData = {
          paper_trade_id: paperTrade.id,
          leg_reference: leg.legReference,
          buy_sell: leg.buySell,
          product: leg.product,
          quantity: leg.quantity,
          period: leg.period,
          price: leg.price,
          broker: leg.broker || tradeData.broker,
          instrument: leg.instrument,
          trading_period: leg.period,
          formula: leg.formula,
          mtm_formula: mtmFormula,
          exposures: exposures,
          pricing_period_start: pricingPeriodStart,
          pricing_period_end: pricingPeriodEnd,
          execution_trade_date: tradeData.executionTradeDate || null
        };
        
        const { error: legError } = await supabase
          .from('paper_trade_legs')
          .insert(legData);
          
        if (legError) {
          throw new Error(`Error creating paper trade leg: ${legError.message}`);
        }
      }
      
      return paperTrade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paperTrades'] });
      toast.success('Paper trade created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
    }
  }).mutateAsync;

  return {
    paperTrades,
    isLoading,
    error,
    refetchPaperTrades,
    createPaperTrade
  };
};
