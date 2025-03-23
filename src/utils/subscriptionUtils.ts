
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
 * @returns A promise that resolves when all subscriptions are paused
 */
export const pauseSubscriptions = async (channelRefs: Record<string, any>) => {
  console.log("Pausing realtime subscriptions");
  
  // Set pause flag on all channels
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
  
  // Add a small delay to ensure any in-flight messages are processed
  await delay(50);
  return channelRefs;
};

/**
 * Resume realtime subscriptions that were previously paused
 * @param channelRefs Record containing channel references to be resumed
 * @returns A promise that resolves when all subscriptions are resumed
 */
export const resumeSubscriptions = async (channelRefs: Record<string, any>) => {
  console.log("Resuming realtime subscriptions");
  
  // Remove pause flag from all channels
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
  
  // Add a small delay to allow the system to stabilize after resuming
  await delay(50);
  return channelRefs;
};

/**
 * A transactional approach to subscription management for critical operations
 * @param channelRefs Record containing channel references
 * @param operation Function containing the critical operation to perform
 * @returns Result of the operation
 */
export const withPausedSubscriptions = async <T>(
  channelRefs: Record<string, any>,
  operation: () => Promise<T>
): Promise<T> => {
  console.log("Starting controlled operation with paused subscriptions");
  
  try {
    // Step 1: Pause all subscriptions
    await pauseSubscriptions(channelRefs);
    
    // Step 2: Execute the critical operation
    const result = await operation();
    
    // Step 3: Resume all subscriptions
    await resumeSubscriptions(channelRefs);
    
    return result;
  } catch (error) {
    // Ensure subscriptions are resumed even if the operation fails
    console.error("Error during controlled operation:", error);
    await resumeSubscriptions(channelRefs);
    throw error;
  }
};
