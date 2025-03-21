
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { delay } from './subscriptionUtils';

/**
 * Delete a paper trade and all its legs with proper sequencing and error handling
 * This function supports both legacy paper trades (in parent_trades/trade_legs) 
 * and new paper trades (in paper_trades/paper_trade_legs)
 */
export const deletePaperTrade = async (tradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for paper trade: ${tradeId}`);
    
    // First check if we're dealing with a legacy paper trade in parent_trades
    const { data: legacyTrade, error: legacyCheckError } = await supabase
      .from('parent_trades')
      .select('id')
      .eq('id', tradeId)
      .eq('trade_type', 'paper')
      .maybeSingle(); // Using maybeSingle instead of single to avoid errors if no data found
      
    if (legacyCheckError && legacyCheckError.code !== 'PGRST116') {
      console.error('Error checking for legacy paper trade:', legacyCheckError);
    }
    
    if (legacyTrade) {
      // Handle legacy paper trade deletion (from parent_trades and trade_legs)
      return await deleteLegacyPaperTrade(tradeId);
    } else {
      // Handle new paper trade deletion (from paper_trades and paper_trade_legs)
      return await deleteNewPaperTrade(tradeId);
    }
  } catch (error) {
    console.error('Error in deletePaperTrade:', error);
    toast.error("Paper trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

/**
 * Delete a legacy paper trade from parent_trades and trade_legs tables
 * @param tradeId ID of the legacy paper trade to delete
 */
async function deleteLegacyPaperTrade(tradeId: string): Promise<boolean> {
  try {
    console.log('Deleting legacy paper trade from parent_trades/trade_legs');
    
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
      
    if (legsError) {
      console.error('Error deleting legacy trade legs:', legsError);
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
      console.error('Error deleting legacy parent trade:', parentError);
      throw parentError;
    }
    
    console.log(`Successfully deleted legacy paper trade: ${tradeId}`);
    return true;
  } catch (error) {
    console.error('Error in deleteLegacyPaperTrade:', error);
    throw error; // Re-throw to be caught by the main deletePaperTrade function
  }
}

/**
 * Delete a new paper trade from paper_trades and paper_trade_legs tables
 * @param tradeId ID of the new paper trade to delete
 */
async function deleteNewPaperTrade(tradeId: string): Promise<boolean> {
  try {
    console.log('Deleting paper trade from paper_trades/paper_trade_legs');
    
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('paper_trade_legs')
      .delete()
      .eq('paper_trade_id', tradeId);
      
    if (legsError) {
      console.error('Error deleting paper trade legs:', legsError);
      throw legsError;
    }
    
    // Add a small delay between operations to avoid database race conditions
    await delay(300);
    
    // Step 2: Delete the paper trade
    const { error: tradeError } = await supabase
      .from('paper_trades')
      .delete()
      .eq('id', tradeId);
      
    if (tradeError) {
      console.error('Error deleting paper trade:', tradeError);
      throw tradeError;
    }
    
    console.log(`Successfully deleted paper trade: ${tradeId}`);
    return true;
  } catch (error) {
    console.error('Error in deleteNewPaperTrade:', error);
    throw error; // Re-throw to be caught by the main deletePaperTrade function
  }
}
