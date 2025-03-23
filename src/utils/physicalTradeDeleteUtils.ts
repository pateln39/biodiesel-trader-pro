import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Delete a physical trade and all its legs with proper sequencing
 */
export const deletePhysicalTrade = async (
  tradeId: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for physical trade: ${tradeId}`);
    onProgress?.(10);
    
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
      
    if (legsError) {
      console.error('Error deleting trade legs:', legsError);
      throw legsError;
    }
    
    onProgress?.(50);
    
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
    
    onProgress?.(100);
    
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
 * Delete a single leg from a physical trade, handling the case where it's the last leg
 */
export const deletePhysicalTradeLeg = async (
  legId: string, 
  parentTradeId: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for leg: ${legId} of trade: ${parentTradeId}`);
    onProgress?.(10);
    
    // First, check if this is the only leg for the parent trade
    const { data: legsCount, error: countError } = await supabase
      .from('trade_legs')
      .select('id', { count: 'exact' })
      .eq('parent_trade_id', parentTradeId);
    
    if (countError) {
      console.error('Error checking remaining legs:', countError);
      throw countError;
    }
    
    onProgress?.(30);
    
    const isLastLeg = legsCount?.length === 1;
    
    // If it's the last leg, delete both the leg and the parent trade
    if (isLastLeg) {
      console.log(`This is the last leg for trade ${parentTradeId}, deleting entire trade`);
      onProgress?.(40);
      return await deletePhysicalTrade(parentTradeId, (progress) => {
        // Scale progress to fit within our 40%-100% range
        onProgress?.(40 + (progress * 0.6));
      });
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
    
    onProgress?.(100);
    
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
