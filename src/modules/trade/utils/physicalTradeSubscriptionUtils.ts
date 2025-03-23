
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Setup realtime subscriptions for physical trades
 */
export const setupPhysicalTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<Record<string, any>>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: (fn: () => void) => void,
  refetch: () => void
) => {
  console.log('[PHYSICAL] Setting up physical trade subscriptions');
  
  // Cleanup any existing subscriptions
  if (realtimeChannelsRef.current.parentTrades) {
    realtimeChannelsRef.current.parentTrades.unsubscribe();
  }
  
  if (realtimeChannelsRef.current.tradeLegs) {
    realtimeChannelsRef.current.tradeLegs.unsubscribe();
  }

  // Subscribe to parent_trades table changes
  const parentTradesChannel = supabase
    .channel('parent-trades-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'parent_trades',
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        console.log(`[PHYSICAL] Change in parent_trades table:`, payload);
        debouncedRefetch(refetch);
      }
    )
    .subscribe();

  // Subscribe to trade_legs table changes
  const tradeLegsChannel = supabase
    .channel('trade-legs-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trade_legs',
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        console.log(`[PHYSICAL] Change in trade_legs table:`, payload);
        debouncedRefetch(refetch);
      }
    )
    .subscribe();

  // Store the channel references for cleanup
  realtimeChannelsRef.current.parentTrades = parentTradesChannel;
  realtimeChannelsRef.current.tradeLegs = tradeLegsChannel;

  // Return a cleanup function
  return () => {
    console.log('[PHYSICAL] Cleaning up physical trade subscriptions');
    if (realtimeChannelsRef.current.parentTrades) {
      realtimeChannelsRef.current.parentTrades.unsubscribe();
    }
    if (realtimeChannelsRef.current.tradeLegs) {
      realtimeChannelsRef.current.tradeLegs.unsubscribe();
    }
  };
};
