
import { supabase } from '@/integrations/supabase/client';

/**
 * Clean up all subscriptions to avoid memory leaks and ensure proper resource management
 * @param channelRefs Record containing channel references to be cleaned up
 */
export const cleanupSubscriptions = (channelRefs: Record<string, any>) => {
  console.log("Cleaning up all subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        supabase.removeChannel(channelRefs[key]);
        channelRefs[key] = null;
      } catch (e) {
        console.error(`Error removing channel ${key}:`, e);
      }
    }
  });
};

/**
 * Utility function to create a controlled delay between operations
 * @param ms Milliseconds to delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Pause realtime subscriptions without removing them completely
 * This prevents the costly cycle of removing and recreating subscriptions
 * @param channelRefs Record containing channel references to be paused
 */
export const pauseSubscriptions = (channelRefs: Record<string, any>) => {
  console.log("Pausing realtime subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        // Set a flag that we can check in message handlers
        channelRefs[key].isPaused = true;
        console.log(`Paused channel: ${key}`);
      } catch (e) {
        console.error(`Error pausing channel ${key}:`, e);
      }
    }
  });
};

/**
 * Resume realtime subscriptions that were previously paused
 * @param channelRefs Record containing channel references to be resumed
 */
export const resumeSubscriptions = (channelRefs: Record<string, any>) => {
  console.log("Resuming realtime subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        // Remove the paused flag so handlers will process messages again
        channelRefs[key].isPaused = false;
        console.log(`Resumed channel: ${key}`);
      } catch (e) {
        console.error(`Error resuming channel ${key}:`, e);
      }
    }
  });
};
