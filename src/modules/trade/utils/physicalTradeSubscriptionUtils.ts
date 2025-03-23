
import { RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Setup Supabase real-time subscriptions for physical trades
 */
export function setupPhysicalTradeSubscriptions(
  realtimeChannelsRef: RefObject<{ [key: string]: any }>,
  isProcessingRef: RefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
): () => void {
  console.log('[PHYSICAL] Setting up physical trade subscriptions');

  // Cleanup existing subscriptions first
  if (realtimeChannelsRef.current.parentTradesChannel) {
    realtimeChannelsRef.current.parentTradesChannel.unsubscribe();
  }
  if (realtimeChannelsRef.current.tradeLegsChannel) {
    realtimeChannelsRef.current.tradeLegsChannel.unsubscribe();
  }

  // Subscribe to parent_trades table
  const parentTradesChannel = supabase
    .channel('parent_trades_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'parent_trades',
      filter: 'trade_type=eq.physical'
    }, (payload) => {
      console.log('[PHYSICAL] Parent trade change detected:', payload);
      debouncedRefetch(refetch);
    })
    .subscribe();

  // Subscribe to trade_legs table
  const tradeLegsChannel = supabase
    .channel('trade_legs_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trade_legs'
    }, (payload) => {
      console.log('[PHYSICAL] Trade leg change detected:', payload);
      debouncedRefetch(refetch);
    })
    .subscribe();

  // Store channels for cleanup
  realtimeChannelsRef.current.parentTradesChannel = parentTradesChannel;
  realtimeChannelsRef.current.tradeLegsChannel = tradeLegsChannel;

  // Return cleanup function
  return () => {
    console.log('[PHYSICAL] Cleaning up physical trade subscriptions');
    if (realtimeChannelsRef.current.parentTradesChannel) {
      realtimeChannelsRef.current.parentTradesChannel.unsubscribe();
    }
    if (realtimeChannelsRef.current.tradeLegsChannel) {
      realtimeChannelsRef.current.tradeLegsChannel.unsubscribe();
    }
  };
}
