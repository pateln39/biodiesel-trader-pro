
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Delete a physical trade and all its legs
 */
export async function deletePhysicalTrade(tradeId: string): Promise<boolean> {
  try {
    // Delete all legs first (due to foreign key constraints)
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
    
    if (legsError) {
      throw new Error(`Failed to delete trade legs: ${legsError.message}`);
    }
    
    // Now delete the parent trade
    const { error: parentError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId);
    
    if (parentError) {
      throw new Error(`Failed to delete parent trade: ${parentError.message}`);
    }
    
    toast.success('Trade deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting physical trade:', error);
    toast.error(`Error deleting trade: ${error.message}`);
    return false;
  }
}
