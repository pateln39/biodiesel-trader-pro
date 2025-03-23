
import { supabase } from '@/integrations/supabase/client';

/**
 * Set up Supabase real-time subscriptions for paper trades
 */
export function setupPaperTradeSubscriptions(
  realtimeChannelsRef: React.MutableRefObject<{ [key: string]: any }>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: Function,
  refetch: Function
) {
  console.log("[PAPER] Setting up real-time subscriptions for paper trades");
  
  // Clean up any existing subscriptions
  Object.values(realtimeChannelsRef.current).forEach((channel: any) => {
    channel?.unsubscribe();
  });
  
  // Reset subscriptions
  realtimeChannelsRef.current = {};

  // Subscribe to parent_trades table changes for paper trades
  const parentTradesChannel = supabase
    .channel('paper-parent-trades-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'parent_trades',
      filter: 'trade_type=eq.paper',
    }, (payload) => {
      console.log("[PAPER] Parent trade change detected:", payload);
      debouncedRefetch(refetch);
    })
    .subscribe((status) => {
      console.log("[PAPER] Parent trades subscription status:", status);
    });
    
  // Subscribe to paper_trade_legs table changes
  const paperTradeLegsChannel = supabase
    .channel('paper-trade-legs-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'paper_trade_legs',
    }, (payload) => {
      console.log("[PAPER] Trade leg change detected:", payload);
      debouncedRefetch(refetch);
    })
    .subscribe((status) => {
      console.log("[PAPER] Trade legs subscription status:", status);
    });
    
  // Store channels for cleanup
  realtimeChannelsRef.current = {
    parentTrades: parentTradesChannel,
    paperTradeLegs: paperTradeLegsChannel,
  };
  
  // Return cleanup function
  return () => {
    console.log("[PAPER] Cleaning up real-time subscriptions");
    Object.values(realtimeChannelsRef.current).forEach((channel: any) => {
      channel?.unsubscribe();
    });
    realtimeChannelsRef.current = {};
  };
}
