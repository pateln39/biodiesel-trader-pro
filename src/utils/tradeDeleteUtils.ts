
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Delay function to control timing between operations
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Delete a physical trade and all its legs with proper sequencing
 */
export const deletePhysicalTrade = async (tradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for physical trade: ${tradeId}`);
    
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
      
    if (legsError) {
      console.error('Error deleting trade legs:', legsError);
      throw legsError;
    }
    
    // Add a small delay between operations to avoid database race conditions
    await delay(300);
    
    // Step 2: Delete the parent trade
    const { error: parentError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId)
      .eq('trade_type', 'physical');
      
    if (parentError) {
      console.error('Error deleting parent trade:', parentError);
      throw parentError;
    }
    
    console.log(`Successfully deleted physical trade: ${tradeId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePhysicalTrade:', error);
    toast.error("Physical trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

/**
 * Delete a single leg from a physical trade with improved error handling
 */
export const deletePhysicalTradeLeg = async (legId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for leg: ${legId}`);
    
    const { error } = await supabase
      .from('trade_legs')
      .delete()
      .eq('id', legId);
    
    if (error) {
      console.error('Error deleting trade leg:', error);
      throw error;
    }
    
    console.log(`Successfully deleted leg: ${legId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePhysicalTradeLeg:', error);
    toast.error("Trade leg deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

/**
 * Delete a paper trade and all its legs with proper sequencing
 */
export const deletePaperTrade = async (tradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for paper trade: ${tradeId}`);
    
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
      
    if (legsError) {
      console.error('Error deleting paper trade legs:', legsError);
      throw legsError;
    }
    
    // Add a small delay between operations to avoid database race conditions
    await delay(300);
    
    // Step 2: Delete the parent trade
    const { error: parentError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId)
      .eq('trade_type', 'paper');
      
    if (parentError) {
      console.error('Error deleting paper parent trade:', parentError);
      throw parentError;
    }
    
    console.log(`Successfully deleted paper trade: ${tradeId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePaperTrade:', error);
    toast.error("Paper trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

// New function to clean up all subscriptions to avoid memory leaks
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
