
import { RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Setup Supabase real-time subscriptions for paper trades
 */
export function setupPaperTradeSubscriptions(
  realtimeChannelsRef: RefObject<{ [key: string]: any }>,
  isProcessingRef: RefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
): () => void {
  console.log('[PAPER] Setting up paper trade subscriptions');

  // Cleanup existing subscriptions first
  if (realtimeChannelsRef.current.paperTradesChannel) {
    realtimeChannelsRef.current.paperTradesChannel.unsubscribe();
  }
  if (realtimeChannelsRef.current.paperTradeLegsChannel) {
    realtimeChannelsRef.current.paperTradeLegsChannel.unsubscribe();
  }

  // Subscribe to paper_trades table
  const paperTradesChannel = supabase
    .channel('paper_trades_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'paper_trades'
    }, (payload) => {
      console.log('[PAPER] Paper trade change detected:', payload);
      debouncedRefetch(refetch);
    })
    .subscribe();

  // Subscribe to paper_trade_legs table
  const paperTradeLegsChannel = supabase
    .channel('paper_trade_legs_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'paper_trade_legs'
    }, (payload) => {
      console.log('[PAPER] Paper trade leg change detected:', payload);
      debouncedRefetch(refetch);
    })
    .subscribe();

  // Store channels for cleanup
  realtimeChannelsRef.current.paperTradesChannel = paperTradesChannel;
  realtimeChannelsRef.current.paperTradeLegsChannel = paperTradeLegsChannel;

  // Return cleanup function
  return () => {
    console.log('[PAPER] Cleaning up paper trade subscriptions');
    if (realtimeChannelsRef.current.paperTradesChannel) {
      realtimeChannelsRef.current.paperTradesChannel.unsubscribe();
    }
    if (realtimeChannelsRef.current.paperTradeLegsChannel) {
      realtimeChannelsRef.current.paperTradeLegsChannel.unsubscribe();
    }
  };
}
