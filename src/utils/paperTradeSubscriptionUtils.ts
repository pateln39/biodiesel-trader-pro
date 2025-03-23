
import { supabase } from '@/integrations/supabase/client';

type ChannelRef = { [key: string]: any };

/**
 * Clean up paper trade subscriptions to avoid memory leaks
 */
export const cleanupPaperSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PAPER] Cleaning up paper trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        supabase.removeChannel(channelRefs[key]);
        channelRefs[key] = null;
      } catch (e) {
        console.error(`[PAPER] Error removing paper channel ${key}:`, e);
      }
    }
  });
};

/**
 * Utility function to create a controlled delay between operations
 */
export const paperDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Pause paper trade realtime subscriptions
 */
export const pausePaperSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PAPER] Pausing paper trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = true;
        console.log(`[PAPER] Paused paper channel: ${key}`);
      } catch (e) {
        console.error(`[PAPER] Error pausing paper channel ${key}:`, e);
      }
    }
  });
};

/**
 * Resume paper trade realtime subscriptions
 */
export const resumePaperSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PAPER] Resuming paper trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = false;
        console.log(`[PAPER] Resumed paper channel: ${key}`);
      } catch (e) {
        console.error(`[PAPER] Error resuming paper channel ${key}:`, e);
      }
    }
  });
};

/**
 * Setup paper trade realtime subscriptions
 */
export const setupPaperTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<ChannelRef>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
) => {
  cleanupPaperSubscriptions(realtimeChannelsRef.current);
  
  const paperTradesChannel = supabase
    .channel('paper_trades_isolated')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'paper_trades'
    }, (payload) => {
      if (realtimeChannelsRef.current.paperTradesChannel?.isPaused) {
        console.log('[PAPER] Subscription paused, skipping update for paper_trades');
        return;
      }
      
      if (!isProcessingRef.current) {
        console.log('[PAPER] Paper trades changed, debouncing refetch...', payload);
        debouncedRefetch(refetch);
      }
    })
    .subscribe();

  realtimeChannelsRef.current.paperTradesChannel = paperTradesChannel;

  const paperTradeLegsChannel = supabase
    .channel('paper_trade_legs_isolated')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'paper_trade_legs' 
    }, (payload) => {
      if (realtimeChannelsRef.current.paperTradeLegsChannel?.isPaused) {
        console.log('[PAPER] Subscription paused, skipping update for paper_trade_legs');
        return;
      }
      
      if (!isProcessingRef.current) {
        console.log('[PAPER] Paper trade legs changed, debouncing refetch...', payload);
        debouncedRefetch(refetch);
      }
    })
    .subscribe();

  realtimeChannelsRef.current.paperTradeLegsChannel = paperTradeLegsChannel;
  
  return () => {
    cleanupPaperSubscriptions(realtimeChannelsRef.current);
  };
};
