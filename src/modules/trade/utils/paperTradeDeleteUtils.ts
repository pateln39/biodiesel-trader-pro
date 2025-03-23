
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Delete a paper trade and all its legs
 */
export async function deletePaperTrade(
  tradeId: string, 
  onSuccess?: () => void
): Promise<boolean> {
  try {
    // Start transaction by setting processing flag
    console.log(`[PAPER] Starting delete for paper trade ID: ${tradeId}`);
    
    // Delete legs first (child records)
    const { error: legsError } = await supabase
      .from('paper_trade_legs')
      .delete()
      .eq('paper_trade_id', tradeId);
    
    if (legsError) {
      throw new Error(`Error deleting paper trade legs: ${legsError.message}`);
    }
    
    // Delete parent trade
    const { error: parentError } = await supabase
      .from('paper_trades')
      .delete()
      .eq('id', tradeId);
    
    if (parentError) {
      throw new Error(`Error deleting paper trade: ${parentError.message}`);
    }
    
    console.log(`[PAPER] Successfully deleted paper trade ID: ${tradeId}`);
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error: any) {
    console.error('[PAPER] Error deleting paper trade:', error);
    toast.error('Failed to delete paper trade', {
      description: error.message
    });
    return false;
  }
}
