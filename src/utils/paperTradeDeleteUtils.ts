
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { delay } from './subscriptionUtils';

/**
 * Delete a paper trade and all its legs
 * @param tradeId ID of the paper trade to delete
 */
export const deletePaperTrade = async (tradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for paper trade: ${tradeId}`);
    
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
    console.error('Error in deletePaperTrade:', error);
    toast.error("Paper trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};
