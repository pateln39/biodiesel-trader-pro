
import { supabase } from '@/integrations/supabase/client';
import { pauseSubscriptions, resumeSubscriptions, cleanupSubscriptions, withPausedSubscriptions } from './subscriptionUtils';

type ChannelRef = { [key: string]: any };

/**
 * Clean up physical trade subscriptions to avoid memory leaks
 */
export const cleanupPhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PHYSICAL] Cleaning up physical trade subscriptions");
  cleanupSubscriptions(channelRefs);
};

/**
 * Pause physical trade realtime subscriptions
 * @returns A promise that resolves when all subscriptions are paused
 */
export const pausePhysicalSubscriptions = async (channelRefs: ChannelRef) => {
  console.log("[PHYSICAL] Pausing physical trade subscriptions");
  return await pauseSubscriptions(channelRefs);
};

/**
 * Resume physical trade realtime subscriptions
 * @returns A promise that resolves when all subscriptions are resumed
 */
export const resumePhysicalSubscriptions = async (channelRefs: ChannelRef) => {
  console.log("[PHYSICAL] Resuming physical trade subscriptions");
  return await resumeSubscriptions(channelRefs);
};

/**
 * Execute a critical operation with paused physical trade subscriptions
 */
export const withPausedPhysicalSubscriptions = async <T>(
  channelRefs: ChannelRef,
  operation: () => Promise<T>
): Promise<T> => {
  console.log("[PHYSICAL] Starting controlled operation with paused physical subscriptions");
  return await withPausedSubscriptions(channelRefs, operation);
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
