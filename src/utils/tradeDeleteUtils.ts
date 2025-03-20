
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Delay function to control timing between operations
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Delete a physical trade and all its legs
 */
export const deletePhysicalTrade = async (tradeId: string): Promise<boolean> => {
  try {
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
      
    if (legsError) {
      throw legsError;
    }
    
    // Step 2: Delete the parent trade
    const { error: parentError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId)
      .eq('trade_type', 'physical');
      
    if (parentError) {
      throw parentError;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting physical trade:', error);
    toast.error("Physical trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

/**
 * Delete a single leg from a physical trade
 */
export const deletePhysicalTradeLeg = async (legId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('trade_legs')
      .delete()
      .eq('id', legId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting trade leg:', error);
    toast.error("Trade leg deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

/**
 * Delete a paper trade and all its legs
 */
export const deletePaperTrade = async (tradeId: string): Promise<boolean> => {
  try {
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
      
    if (legsError) {
      throw legsError;
    }
    
    // Step 2: Delete the parent trade
    const { error: parentError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId)
      .eq('trade_type', 'paper');
      
    if (parentError) {
      throw parentError;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting paper trade:', error);
    toast.error("Paper trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};
