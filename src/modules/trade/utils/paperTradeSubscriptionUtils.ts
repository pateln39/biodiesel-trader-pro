
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Setup realtime subscriptions for paper trades
 */
export const setupPaperTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<Record<string, any>>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: (fn: () => void) => void,
  refetch: () => void
) => {
  console.log('[PAPER] Setting up paper trade subscriptions');
  
  // Cleanup any existing subscriptions
  if (realtimeChannelsRef.current.paperTrades) {
    realtimeChannelsRef.current.paperTrades.unsubscribe();
  }
  
  if (realtimeChannelsRef.current.paperTradeLegs) {
    realtimeChannelsRef.current.paperTradeLegs.unsubscribe();
  }

  // Subscribe to paper_trades table changes
  const paperTradesChannel = supabase
    .channel('paper-trades-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'paper_trades',
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        console.log(`[PAPER] Change in paper_trades table:`, payload);
        debouncedRefetch(refetch);
      }
    )
    .subscribe();

  // Subscribe to paper_trade_legs table changes
  const paperTradeLegsChannel = supabase
    .channel('paper-trade-legs-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'paper_trade_legs',
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        console.log(`[PAPER] Change in paper_trade_legs table:`, payload);
        debouncedRefetch(refetch);
      }
    )
    .subscribe();

  // Store the channel references for cleanup
  realtimeChannelsRef.current.paperTrades = paperTradesChannel;
  realtimeChannelsRef.current.paperTradeLegs = paperTradeLegsChannel;

  // Return a cleanup function
  return () => {
    console.log('[PAPER] Cleaning up paper trade subscriptions');
    if (realtimeChannelsRef.current.paperTrades) {
      realtimeChannelsRef.current.paperTrades.unsubscribe();
    }
    if (realtimeChannelsRef.current.paperTradeLegs) {
      realtimeChannelsRef.current.paperTradeLegs.unsubscribe();
    }
  };
};
