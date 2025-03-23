
import { supabase } from '@/integrations/supabase/client';

type ChannelRef = { [key: string]: any };

/**
 * Clean up physical trade subscriptions to avoid memory leaks
 */
export const cleanupPhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PHYSICAL] Cleaning up physical trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        supabase.removeChannel(channelRefs[key]);
        channelRefs[key] = null;
      } catch (e) {
        console.error(`[PHYSICAL] Error removing physical channel ${key}:`, e);
      }
    }
  });
};

/**
 * Pause physical trade realtime subscriptions
 */
export const pausePhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PHYSICAL] Pausing physical trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = true;
        console.log(`[PHYSICAL] Paused physical channel: ${key}`);
      } catch (e) {
        console.error(`[PHYSICAL] Error pausing physical channel ${key}:`, e);
      }
    }
  });
};

/**
 * Resume physical trade realtime subscriptions
 */
export const resumePhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PHYSICAL] Resuming physical trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = false;
        console.log(`[PHYSICAL] Resumed physical channel: ${key}`);
      } catch (e) {
        console.error(`[PHYSICAL] Error resuming physical channel ${key}:`, e);
      }
    }
  });
};

/**
 * Setup physical trade realtime subscriptions
 */
export const setupPhysicalTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<ChannelRef>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
) => {
  cleanupPhysicalSubscriptions(realtimeChannelsRef.current);
  
  const parentTradesChannel = supabase
    .channel('physical_parent_trades_isolated')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'parent_trades',
      filter: 'trade_type=eq.physical'
    }, (payload) => {
      if (realtimeChannelsRef.current.parentTradesChannel?.isPaused) {
        console.log('[PHYSICAL] Subscription paused, skipping update for parent_trades');
        return;
      }
      
      if (!isProcessingRef.current) {
        console.log('[PHYSICAL] Physical parent trades changed, debouncing refetch...', payload);
        debouncedRefetch(refetch);
      }
    })
    .subscribe();
  
  realtimeChannelsRef.current.parentTradesChannel = parentTradesChannel;

  const tradeLegsChannel = supabase
    .channel('trade_legs_for_physical_isolated')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'trade_legs' 
    }, (payload) => {
      if (realtimeChannelsRef.current.tradeLegsChannel?.isPaused) {
        console.log('[PHYSICAL] Subscription paused, skipping update for trade_legs');
        return;
      }
      
      if (!isProcessingRef.current) {
        console.log('[PHYSICAL] Trade legs changed, debouncing refetch...', payload);
        debouncedRefetch(refetch);
      }
    })
    .subscribe();
  
  realtimeChannelsRef.current.tradeLegsChannel = tradeLegsChannel;
  
  return () => {
    cleanupPhysicalSubscriptions(realtimeChannelsRef.current);
  };
};
