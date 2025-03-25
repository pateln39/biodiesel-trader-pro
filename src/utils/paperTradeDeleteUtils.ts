
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
    toast.success("Paper trade deleted successfully");
    return true;
  } catch (error) {
    console.error('Error in deletePaperTrade:', error);
    toast.error("Paper trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};

/**
 * Delete a single leg from a paper trade
 * If it's the last leg, the entire trade will be deleted
 * @param legId ID of the leg to delete
 * @param parentTradeId ID of the parent paper trade
 */
export const deletePaperTradeLeg = async (legId: string, parentTradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for paper trade leg: ${legId} (parent: ${parentTradeId})`);
    
    // Step 1: Check how many legs this trade has
    const { data: legCount, error: countError } = await supabase
      .from('paper_trade_legs')
      .select('id', { count: 'exact' })
      .eq('paper_trade_id', parentTradeId);
      
    if (countError) {
      console.error('Error counting paper trade legs:', countError);
      throw countError;
    }
    
    const totalLegs = legCount?.length || 0;
    console.log(`Trade has ${totalLegs} legs in total`);
    
    // Step 2: Delete the specific leg
    const { error: legError } = await supabase
      .from('paper_trade_legs')
      .delete()
      .eq('id', legId);
      
    if (legError) {
      console.error('Error deleting paper trade leg:', legError);
      throw legError;
    }
    
    // Step 3: If this was the last leg, also delete the parent trade
    if (totalLegs <= 1) {
      console.log(`Deleting parent paper trade ${parentTradeId} as this was the last leg`);
      
      // Add a small delay to avoid database race conditions
      await delay(300);
      
      const { error: parentError } = await supabase
        .from('paper_trades')
        .delete()
        .eq('id', parentTradeId);
        
      if (parentError) {
        console.error('Error deleting parent paper trade:', parentError);
        throw parentError;
      }
      
      toast.success("Paper trade deleted successfully", {
        description: "Last leg was removed, so the entire trade was deleted"
      });
    } else {
      toast.success("Paper trade leg deleted successfully");
    }
    
    console.log(`Successfully deleted paper trade leg: ${legId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePaperTradeLeg:', error);
    toast.error("Paper trade leg deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};
