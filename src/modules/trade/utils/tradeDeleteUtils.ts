
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

/**
 * Delete a paper trade and its legs
 */
export const deletePaperTrade = async (tradeId: string) => {
  try {
    // First delete the associated trade legs
    const { error: legDeleteError } = await supabase
      .from('paper_trade_legs')
      .delete()
      .eq('paper_trade_id', tradeId);

    if (legDeleteError) {
      throw new Error(`Failed to delete trade legs: ${legDeleteError.message}`);
    }

    // Then delete the paper trade
    const { error: tradeDeleteError } = await supabase
      .from('paper_trades')
      .delete()
      .eq('id', tradeId);

    if (tradeDeleteError) {
      throw new Error(`Failed to delete paper trade: ${tradeDeleteError.message}`);
    }

    toast.success('Trade deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting paper trade:', error);
    toast.error('Failed to delete trade', {
      description: error.message
    });
    return false;
  }
};

/**
 * Delete a trade (either physical or paper)
 */
export const deleteTrade = async (tradeId: string, tradeType: 'physical' | 'paper') => {
  if (tradeType === 'physical') {
    return deletePhysicalTrade(tradeId);
  } else {
    return deletePaperTrade(tradeId);
  }
};
