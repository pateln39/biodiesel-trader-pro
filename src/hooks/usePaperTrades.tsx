
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { PaperTrade } from '@/types/paper';

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  
  // Subscribe to realtime changes
  useEffect(() => {
    const paperTradesChannel = supabase
      .channel('paper-trades-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'paper_trades',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['paperTrades'] });
      })
      .subscribe();
      
    const paperTradeLegsChannel = supabase
      .channel('paper-trade-legs-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'paper_trade_legs',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['paperTrades'] });
      })
      .subscribe();
    
    return () => {
      console.info('[PAPER] Cleaning up paper trade subscriptions');
      supabase.removeChannel(paperTradesChannel);
      supabase.removeChannel(paperTradeLegsChannel);
    };
  }, [queryClient]);
  
  // Fetch paper trades
  const { data: paperTrades = [], isLoading, error } = useQuery({
    queryKey: ['paperTrades'],
    queryFn: async () => {
      // First fetch paper trades
      const { data: trades, error: tradesError } = await supabase
        .from('paper_trades')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (tradesError) throw tradesError;
      
      // Then fetch legs for each trade
      const tradesWithLegs: PaperTrade[] = [];
      
      for (const trade of trades) {
        const { data: legs, error: legsError } = await supabase
          .from('paper_trade_legs')
          .select('*')
          .eq('paper_trade_id', trade.id)
          .order('created_at', { ascending: true });
          
        if (legsError) throw legsError;
        
        tradesWithLegs.push({
          id: trade.id,
          tradeReference: trade.trade_reference,
          broker: trade.broker,
          counterparty: trade.counterparty,
          comment: trade.comment,
          createdAt: new Date(trade.created_at),
          updatedAt: new Date(trade.updated_at),
          legs: legs.map(leg => ({
            id: leg.id,
            legReference: leg.leg_reference,
            paperTradeId: leg.paper_trade_id,
            buySell: leg.buy_sell,
            product: leg.product,
            quantity: leg.quantity,
            price: leg.price,
            formula: leg.formula,
            mtmFormula: leg.mtm_formula,
            exposures: leg.exposures,
            period: leg.period,
            broker: leg.broker,
            instrument: leg.instrument,
            relationshipType: leg.relationship_type || 'FP',
            rightSide: leg.right_side,
            tradingPeriod: leg.trading_period,
            createdAt: new Date(leg.created_at),
            updatedAt: new Date(leg.updated_at)
          }))
        });
      }
      
      console.info(`[PAPER] Found ${tradesWithLegs.length} paper trades`);
      return tradesWithLegs;
    }
  });
  
  // Create a new paper trade
  const createPaperTrade = useMutation({
    mutationFn: async (data: any, options?: any) => {
      // First create the parent trade
      const { data: tradeData, error: tradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: data.tradeReference,
          broker: data.broker,
          counterparty: data.counterparty || '',
          comment: data.comment
        })
        .select('id')
        .single();
        
      if (tradeError) throw tradeError;
      
      // Then create legs for the trade
      const paperTradeId = tradeData.id;
      const legs = data.legs.map((leg: any) => ({
        paper_trade_id: paperTradeId,
        leg_reference: leg.legReference,
        buy_sell: leg.buySell,
        product: leg.product,
        quantity: leg.quantity,
        price: leg.price,
        formula: leg.mtmFormula,
        mtm_formula: leg.mtmFormula,
        period: leg.period,
        broker: data.broker,
        instrument: leg.product,
        relationship_type: leg.relationshipType,
        right_side: leg.rightSide,
        exposures: leg.exposures,
        trading_period: leg.period
      }));
      
      const { error: legsError } = await supabase
        .from('paper_trade_legs')
        .insert(legs);
        
      if (legsError) throw legsError;
      
      // Return the created trade with its legs
      return {
        id: paperTradeId,
        tradeReference: data.tradeReference,
        legs
      };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['paperTrades'] });
      toast.success('Paper trade created', {
        description: `Trade reference: ${variables.tradeReference}`
      });
      
      if (context?.onSuccess) {
        context.onSuccess(data);
      }
    },
    onError: (error: any, variables, context) => {
      console.error('Error creating paper trade:', error);
      toast.error('Failed to create paper trade', {
        description: error.message
      });
      
      if (context?.onError) {
        context.onError(error);
      }
    }
  });
  
  // Delete a paper trade
  const deletePaperTrade = useMutation({
    mutationFn: async (tradeId: string) => {
      // Delete the legs first
      const { error: legsError } = await supabase
        .from('paper_trade_legs')
        .delete()
        .eq('paper_trade_id', tradeId);
        
      if (legsError) throw legsError;
      
      // Then delete the parent trade
      const { error: tradeError } = await supabase
        .from('paper_trades')
        .delete()
        .eq('id', tradeId);
        
      if (tradeError) throw tradeError;
      
      return tradeId;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paperTrades'] });
      toast.success('Paper trade deleted');
    },
    onError: (error: any) => {
      console.error('Error deleting paper trade:', error);
      toast.error('Failed to delete paper trade', {
        description: error.message
      });
    }
  });
  
  return {
    paperTrades,
    isLoading,
    error,
    refetchPaperTrades: () => queryClient.invalidateQueries({ queryKey: ['paperTrades'] }),
    createPaperTrade: (data: any, options?: any) => 
      createPaperTrade.mutate(data, options),
    deletePaperTrade: (tradeId: string) => 
      deletePaperTrade.mutate(tradeId)
  };
};
