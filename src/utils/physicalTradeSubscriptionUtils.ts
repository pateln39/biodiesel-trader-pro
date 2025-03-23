
import { supabase } from '@/integrations/supabase/client';

type ChannelRef = { [key: string]: any };

/**
 * Clean up physical trade subscriptions to avoid memory leaks
 */
export const cleanupPhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[SUBSCRIPTION] Cleaning up physical trade subscriptions");
  
  if (!channelRefs) {
    console.log("[SUBSCRIPTION] No channel refs provided, skipping cleanup");
    return;
  }
  
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        supabase.removeChannel(channelRefs[key]);
        channelRefs[key] = null;
        console.log(`[SUBSCRIPTION] Removed channel: ${key}`);
      } catch (e) {
        console.error(`[SUBSCRIPTION] Error removing physical channel ${key}:`, e);
      }
    }
  });
};

/**
 * Pause physical trade realtime subscriptions
 */
export const pausePhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[SUBSCRIPTION] Pausing physical trade subscriptions");
  
  if (!channelRefs) {
    console.log("[SUBSCRIPTION] No channel refs provided, skipping pause");
    return;
  }
  
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = true;
        console.log(`[SUBSCRIPTION] Paused physical channel: ${key}`);
      } catch (e) {
        console.error(`[SUBSCRIPTION] Error pausing physical channel ${key}:`, e);
      }
    }
  });
};

/**
 * Resume physical trade realtime subscriptions
 */
export const resumePhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[SUBSCRIPTION] Resuming physical trade subscriptions");
  
  if (!channelRefs) {
    console.log("[SUBSCRIPTION] No channel refs provided, skipping resume");
    return;
  }
  
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = false;
        console.log(`[SUBSCRIPTION] Resumed physical channel: ${key}`);
      } catch (e) {
        console.error(`[SUBSCRIPTION] Error resuming physical channel ${key}:`, e);
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
  if (!realtimeChannelsRef || !realtimeChannelsRef.current) {
    console.error("[SUBSCRIPTION] Invalid channel ref, cannot setup subscriptions");
    return () => {};
  }

  // Clean up any existing subscriptions first
  cleanupPhysicalSubscriptions(realtimeChannelsRef.current);
  
  try {
    const parentTradesChannel = supabase
      .channel('physical_parent_trades_isolated')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parent_trades',
        filter: 'trade_type=eq.physical'
      }, (payload) => {
        if (realtimeChannelsRef.current?.parentTradesChannel?.isPaused) {
          console.log('[SUBSCRIPTION] Subscription paused, skipping update for parent_trades');
          return;
        }
        
        if (!isProcessingRef.current) {
          console.log('[SUBSCRIPTION] Physical parent trades changed, debouncing refetch...', payload);
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
        if (realtimeChannelsRef.current?.tradeLegsChannel?.isPaused) {
          console.log('[SUBSCRIPTION] Subscription paused, skipping update for trade_legs');
          return;
        }
        
        if (!isProcessingRef.current) {
          console.log('[SUBSCRIPTION] Trade legs changed, debouncing refetch...', payload);
          debouncedRefetch(refetch);
        }
      })
      .subscribe();
    
    realtimeChannelsRef.current.tradeLegsChannel = tradeLegsChannel;
  } catch (error) {
    console.error("[SUBSCRIPTION] Error setting up subscriptions:", error);
  }
  
  return () => {
    cleanupPhysicalSubscriptions(realtimeChannelsRef.current);
  };
};
