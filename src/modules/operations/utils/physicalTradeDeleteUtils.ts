
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { delay } from '@/core/utils/subscriptionUtils';

/**
 * Delete a physical trade and all its legs
 * @param tradeId ID of the physical trade to delete
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
      console.error('Error deleting physical trade legs:', legsError);
      throw legsError;
    }
    
    // Add a small delay between operations to avoid database race conditions
    await delay(300);
    
    // Step 2: Delete the parent trade
    const { error: tradeError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId);
      
    if (tradeError) {
      console.error('Error deleting parent trade:', tradeError);
      throw tradeError;
    }
    
    console.log(`Successfully deleted physical trade: ${tradeId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePhysicalTrade:', error);
    toast.error("Physical trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};

/**
 * Delete a single leg from a physical trade
 * If it's the last leg, the entire trade will be deleted
 * @param legId ID of the leg to delete
 * @param parentTradeId ID of the parent trade
 */
export const deletePhysicalTradeLeg = async (legId: string, parentTradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for physical trade leg: ${legId} (parent: ${parentTradeId})`);
    
    // Step 1: Check how many legs this trade has
    const { data: legCount, error: countError } = await supabase
      .from('trade_legs')
      .select('id', { count: 'exact' })
      .eq('parent_trade_id', parentTradeId);
      
    if (countError) {
      console.error('Error counting physical trade legs:', countError);
      throw countError;
    }
    
    const totalLegs = legCount?.length || 0;
    console.log(`Trade has ${totalLegs} legs in total`);
    
    // Step 2: Delete the specific leg
    const { error: legError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('id', legId);
      
    if (legError) {
      console.error('Error deleting physical trade leg:', legError);
      throw legError;
    }
    
    // Step 3: If this was the last leg, also delete the parent trade
    if (totalLegs <= 1) {
      console.log(`Deleting parent trade ${parentTradeId} as this was the last leg`);
      
      // Add a small delay to avoid database race conditions
      await delay(300);
      
      const { error: parentError } = await supabase
        .from('parent_trades')
        .delete()
        .eq('id', parentTradeId);
        
      if (parentError) {
        console.error('Error deleting parent trade:', parentError);
        throw parentError;
      }
    }
    
    console.log(`Successfully deleted physical trade leg: ${legId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePhysicalTradeLeg:', error);
    toast.error("Physical trade leg deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};
