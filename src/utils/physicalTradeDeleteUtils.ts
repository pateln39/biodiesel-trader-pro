import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { delay } from './subscriptionUtils';

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
    toast.success("Trade deleted successfully");
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
 * Delete a single leg from a physical trade, handling the case where it's the last leg
 */
export const deletePhysicalTradeLeg = async (legId: string, parentTradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for leg: ${legId} of trade: ${parentTradeId}`);
    
    // First, check if this is the only leg for the parent trade
    const { data: legsCount, error: countError } = await supabase
      .from('trade_legs')
      .select('id', { count: 'exact' })
      .eq('parent_trade_id', parentTradeId);
    
    if (countError) {
      console.error('Error checking remaining legs:', countError);
      throw countError;
    }
    
    const isLastLeg = legsCount?.length === 1;
    
    // If it's the last leg, delete both the leg and the parent trade
    if (isLastLeg) {
      console.log(`This is the last leg for trade ${parentTradeId}, deleting entire trade`);
      return await deletePhysicalTrade(parentTradeId);
    }
    
    // Otherwise, just delete the leg
    const { error } = await supabase
      .from('trade_legs')
      .delete()
      .eq('id', legId);
    
    if (error) {
      console.error('Error deleting trade leg:', error);
      throw error;
    }
    
    console.log(`Successfully deleted leg: ${legId}`);
    toast.success("Trade leg deleted successfully");
    return true;
  } catch (error) {
    console.error('Error in deletePhysicalTradeLeg:', error);
    toast.error("Trade leg deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};
