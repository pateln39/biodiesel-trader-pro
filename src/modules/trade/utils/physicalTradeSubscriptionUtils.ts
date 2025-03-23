
import { supabase } from '@/integrations/supabase/client';

/**
 * Set up Supabase real-time subscriptions for physical trades
 */
export function setupPhysicalTradeSubscriptions(
  realtimeChannelsRef: React.MutableRefObject<{ [key: string]: any }>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: Function,
  refetch: Function
) {
  console.log("[PHYSICAL] Setting up real-time subscriptions for physical trades");
  
  // Clean up any existing subscriptions
  Object.values(realtimeChannelsRef.current).forEach((channel: any) => {
    channel?.unsubscribe();
  });
  
  // Reset subscriptions
  realtimeChannelsRef.current = {};

  // Subscribe to parent_trades table changes for physical trades
  const parentTradesChannel = supabase
    .channel('physical-parent-trades-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'parent_trades',
      filter: 'trade_type=eq.physical',
    }, (payload) => {
      console.log("[PHYSICAL] Parent trade change detected:", payload);
      debouncedRefetch(refetch);
    })
    .subscribe((status) => {
      console.log("[PHYSICAL] Parent trades subscription status:", status);
    });
    
  // Subscribe to trade_legs table changes
  const tradeLegsChannel = supabase
    .channel('physical-trade-legs-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trade_legs',
    }, (payload) => {
      console.log("[PHYSICAL] Trade leg change detected:", payload);
      debouncedRefetch(refetch);
    })
    .subscribe((status) => {
      console.log("[PHYSICAL] Trade legs subscription status:", status);
    });
    
  // Store channels for cleanup
  realtimeChannelsRef.current = {
    parentTrades: parentTradesChannel,
    tradeLegs: tradeLegsChannel,
  };
  
  // Return cleanup function
  return () => {
    console.log("[PHYSICAL] Cleaning up real-time subscriptions");
    Object.values(realtimeChannelsRef.current).forEach((channel: any) => {
      channel?.unsubscribe();
    });
    realtimeChannelsRef.current = {};
  };
}
