
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Delete a physical trade and all its legs
 */
export async function deletePhysicalTrade(
  tradeId: string, 
  onSuccess?: () => void
): Promise<boolean> {
  try {
    // Start transaction by setting processing flag
    console.log(`[PHYSICAL] Starting delete for trade ID: ${tradeId}`);
    
    // Delete legs first (child records)
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
    
    if (legsError) {
      throw new Error(`Error deleting trade legs: ${legsError.message}`);
    }
    
    // Delete parent trade
    const { error: parentError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId);
    
    if (parentError) {
      throw new Error(`Error deleting parent trade: ${parentError.message}`);
    }
    
    console.log(`[PHYSICAL] Successfully deleted trade ID: ${tradeId}`);
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error: any) {
    console.error('[PHYSICAL] Error deleting trade:', error);
    toast.error('Failed to delete trade', {
      description: error.message
    });
    return false;
  }
}
