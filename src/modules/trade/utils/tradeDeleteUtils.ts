
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define TradeType enum for this file to avoid circular references
enum TradeType {
  Physical = 'physical',
  Paper = 'paper'
}

/**
 * Delete a physical trade and its associated legs
 */
export const deletePhysicalTrade = async (tradeId: string): Promise<boolean> => {
  try {
    // First delete all trade legs
    const { error: legDeleteError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);

    if (legDeleteError) {
      console.error('Error deleting trade legs:', legDeleteError);
      toast.error('Error deleting trade legs', {
        description: legDeleteError.message
      });
      return false;
    }

    // Then delete the parent trade
    const { error: tradeDeleteError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId);

    if (tradeDeleteError) {
      console.error('Error deleting parent trade:', tradeDeleteError);
      toast.error('Error deleting parent trade', {
        description: tradeDeleteError.message
      });
      return false;
    }

    toast.success('Trade deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error in deletePhysicalTrade:', error);
    toast.error('Error deleting trade', {
      description: error.message
    });
    return false;
  }
};

/**
 * Delete a paper trade and its associated legs
 */
export const deletePaperTrade = async (tradeId: string): Promise<boolean> => {
  try {
    // First delete all paper trade legs
    const { error: legDeleteError } = await supabase
      .from('paper_trade_legs')
      .delete()
      .eq('paper_trade_id', tradeId);

    if (legDeleteError) {
      console.error('Error deleting paper trade legs:', legDeleteError);
      toast.error('Error deleting paper trade legs', {
        description: legDeleteError.message
      });
      return false;
    }

    // Then delete the paper trade
    const { error: tradeDeleteError } = await supabase
      .from('paper_trades')
      .delete()
      .eq('id', tradeId);

    if (tradeDeleteError) {
      console.error('Error deleting paper trade:', tradeDeleteError);
      toast.error('Error deleting paper trade', {
        description: tradeDeleteError.message
      });
      return false;
    }

    toast.success('Paper trade deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error in deletePaperTrade:', error);
    toast.error('Error deleting paper trade', {
      description: error.message
    });
    return false;
  }
};

/**
 * Generic trade delete function that routes to the appropriate delete method
 */
export const deleteTrade = async (tradeId: string, tradeType: string): Promise<boolean> => {
  if (tradeType === TradeType.Physical) {
    return deletePhysicalTrade(tradeId);
  } else if (tradeType === TradeType.Paper) {
    return deletePaperTrade(tradeId);
  }
  
  console.error('Unknown trade type:', tradeType);
  toast.error('Unknown trade type');
  return false;
};
