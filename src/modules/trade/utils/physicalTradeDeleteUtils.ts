
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Delete a physical trade and its legs
 */
export const deletePhysicalTrade = async (tradeId: string) => {
  try {
    // First delete the associated trade legs
    const { error: legDeleteError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);

    if (legDeleteError) {
      throw new Error(`Failed to delete trade legs: ${legDeleteError.message}`);
    }

    // Then delete the parent trade
    const { error: tradeDeleteError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId);

    if (tradeDeleteError) {
      throw new Error(`Failed to delete parent trade: ${tradeDeleteError.message}`);
    }

    toast.success('Trade deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting physical trade:', error);
    toast.error('Failed to delete trade', {
      description: error.message
    });
    return false;
  }
};
