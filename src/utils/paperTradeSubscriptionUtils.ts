
import { supabase } from '@/integrations/supabase/client';
import { isBulkModeActive, isInCooldownPeriod, getAdaptiveDebounceDelay } from './bulkOperationManager';
import { paperTradeCircuitBreaker } from './circuitBreaker';

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
 * Check if subscriptions should be paused based on current state
 */
const shouldPauseSubscriptions = (): boolean => {
  const bulkMode = isBulkModeActive();
  const cooldown = isInCooldownPeriod();
  const circuitOpen = paperTradeCircuitBreaker.isCircuitOpen();
  
  if (bulkMode || cooldown || circuitOpen) {
    console.log(`[PAPER] Subscriptions should be paused - bulk: ${bulkMode}, cooldown: ${cooldown}, circuit: ${circuitOpen}`);
    return true;
  }
  
  return false;
};

/**
 * Handle realtime events with smart filtering
 */
const handleRealtimeEvent = (
  channelName: string,
  payload: any,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
) => {
  // Check if circuit breaker allows this event
  if (!paperTradeCircuitBreaker.recordEvent()) {
    console.log(`[PAPER] Circuit breaker blocked event for ${channelName}`);
    return;
  }
  
  // Check if subscriptions should be paused
  if (shouldPauseSubscriptions()) {
    console.log(`[PAPER] Subscription paused, skipping update for ${channelName}`);
    return;
  }
  
  if (!isProcessingRef.current) {
    console.log(`[PAPER] ${channelName} changed, debouncing refetch...`, payload);
    debouncedRefetch(refetch);
  } else {
    console.log(`[PAPER] Processing in progress, skipping refetch for ${channelName}`);
  }
};

/**
 * Setup paper trade realtime subscriptions with smart management
 */
export const setupPaperTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<ChannelRef>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
) => {
  cleanupPaperSubscriptions(realtimeChannelsRef.current);
  
  const paperTradesChannel = supabase
    .channel('paper_trades_smart')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'paper_trades'
    }, (payload) => {
      handleRealtimeEvent(
        'paper_trades',
        payload,
        isProcessingRef,
        debouncedRefetch,
        refetch
      );
    })
    .subscribe();

  realtimeChannelsRef.current.paperTradesChannel = paperTradesChannel;

  const paperTradeLegsChannel = supabase
    .channel('paper_trade_legs_smart')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'paper_trade_legs' 
    }, (payload) => {
      handleRealtimeEvent(
        'paper_trade_legs',
        payload,
        isProcessingRef,
        debouncedRefetch,
        refetch
      );
    })
    .subscribe();

  realtimeChannelsRef.current.paperTradeLegsChannel = paperTradeLegsChannel;
  
  return () => {
    cleanupPaperSubscriptions(realtimeChannelsRef.current);
  };
};

/**
 * Get current subscription status for UI display
 */
export const getSubscriptionStatus = () => {
  const bulkMode = isBulkModeActive();
  const cooldown = isInCooldownPeriod();
  const circuitOpen = paperTradeCircuitBreaker.isCircuitOpen();
  
  if (circuitOpen) {
    return { paused: true, reason: 'circuit_breaker', message: 'Too many updates detected. Real-time updates temporarily disabled.' };
  }
  
  if (bulkMode) {
    return { paused: true, reason: 'bulk_operation', message: 'Bulk operation in progress. Real-time updates paused.' };
  }
  
  if (cooldown) {
    return { paused: true, reason: 'cooldown', message: 'Bulk operation completed. Resuming real-time updates shortly...' };
  }
  
  return { paused: false, reason: null, message: null };
};
