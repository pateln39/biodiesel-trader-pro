
import { MutableRefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Set up realtime subscription for physical trades and trade legs
 * @param realtimeChannelsRef Reference to store realtime channels
 * @param isProcessingRef Reference to track if a processing operation is in progress
 * @param debouncedRefetch Debounced function to refetch data
 * @param refetch Function to refetch data
 * @returns Cleanup function to unsubscribe
 */
export const setupPhysicalTradeSubscriptions = (
  realtimeChannelsRef: MutableRefObject<Record<string, any>>,
  isProcessingRef: MutableRefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
) => {
  // Subscribe to parent_trades table changes
  console.log('[PHYSICAL] Setting up parent_trades subscription');
  realtimeChannelsRef.current.parentTrades = supabase
    .channel('parent_trades_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'parent_trades',
      filter: 'trade_type=eq.physical'
    }, () => {
      console.log('[PHYSICAL] Parent trades changed, triggering refetch');
      debouncedRefetch(refetch);
    })
    .subscribe((status) => {
      console.log('[PHYSICAL] Parent trades subscription status:', status);
    });

  // Subscribe to trade_legs table changes
  console.log('[PHYSICAL] Setting up trade_legs subscription');
  realtimeChannelsRef.current.tradeLegs = supabase
    .channel('trade_legs_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trade_legs'
    }, () => {
      console.log('[PHYSICAL] Trade legs changed, triggering refetch');
      debouncedRefetch(refetch);
    })
    .subscribe((status) => {
      console.log('[PHYSICAL] Trade legs subscription status:', status);
    });

  // Return a cleanup function to unsubscribe from all channels
  return () => {
    console.log('[PHYSICAL] Cleaning up subscriptions');
    if (realtimeChannelsRef.current.parentTrades) {
      supabase.removeChannel(realtimeChannelsRef.current.parentTrades);
    }
    if (realtimeChannelsRef.current.tradeLegs) {
      supabase.removeChannel(realtimeChannelsRef.current.tradeLegs);
    }
    realtimeChannelsRef.current = {};
  };
};
