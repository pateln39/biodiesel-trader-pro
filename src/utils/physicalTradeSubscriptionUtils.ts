
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
 * Setup physical trade realtime subscriptions
 */
export const setupPhysicalTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<ChannelRef>,
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
        console.log('[SUBSCRIPTION] Physical parent trades changed, triggering refetch...', payload);
        refetch();
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
        console.log('[SUBSCRIPTION] Trade legs changed, triggering refetch...', payload);
        refetch();
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
