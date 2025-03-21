
import { supabase } from '@/integrations/supabase/client';

/**
 * Clean up all subscriptions to avoid memory leaks and ensure proper resource management
 * @param channelRefs Record containing channel references to be cleaned up
 */
export const cleanupSubscriptions = (channelRefs: Record<string, any>) => {
  console.log("Cleaning up all trade subscriptions");
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
