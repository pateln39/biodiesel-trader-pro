
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateAndParsePricingFormula, createEmptyFormula } from '@/utils/paperFormulaUtils';
import { validateAndParsePhysicalFormula, createEmptyPhysicalFormula } from '@/utils/physicalFormulaUtils';

// Delay function for smoother migrations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Migration function to move paper trades from physical_trades table to paper_trades table
export const migratePaperTrades = async (): Promise<boolean> => {
  try {
    console.log('Starting paper trade migration');
    
    // Step 1: Get all paper trades from physical_trades table
    const { data: paperTradesInPhysicalTable, error: fetchError } = await supabase
      .from('physical_trades')
      .select('*')
      .eq('trade_type', 'paper');
      
    if (fetchError) {
      throw new Error(`Error fetching paper trades: ${fetchError.message}`);
    }
    
    console.log(`Found ${paperTradesInPhysicalTable?.length || 0} paper trades to migrate`);
    
    if (!paperTradesInPhysicalTable || paperTradesInPhysicalTable.length === 0) {
      console.log('No paper trades to migrate');
      return true;
    }
    
    // Step 2: Migrate each paper trade
    for (const paperTrade of paperTradesInPhysicalTable) {
      // First, get the legs for this trade
      const { data: legData, error: legFetchError } = await supabase
        .from('physical_trade_legs')
        .select('*')
        .eq('parent_trade_id', paperTrade.id);
        
      if (legFetchError) {
        console.error(`Error fetching legs for trade ${paperTrade.id}: ${legFetchError.message}`);
        continue;
      }
      
      // Create the new paper trade in the paper_trades table
      const { data: newPaperTrade, error: insertTradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: paperTrade.trade_reference,
          counterparty: paperTrade.counterparty,
          comment: paperTrade.comment || '',
          broker: paperTrade.broker || legData?.[0]?.broker || 'Unknown',
          created_at: paperTrade.created_at,
          updated_at: paperTrade.updated_at
        })
        .select('id')
        .single();
        
      if (insertTradeError) {
        console.error(`Error creating paper trade: ${insertTradeError.message}`);
        continue;
      }
      
      // Create the legs in the paper_trade_legs table
      if (legData && legData.length > 0) {
        for (const leg of legData) {
          const newLeg = {
            parent_trade_id: newPaperTrade.id,
            leg_reference: leg.leg_reference,
            buy_sell: leg.buy_sell,
            product: leg.product,
            quantity: leg.quantity,
            period: leg.trading_period || '',
            price: leg.price || 0,
            broker: leg.broker || '',
            relationship_type: leg.relationship_type || 'FP',
            instrument: leg.instrument || '',
            formula: validateAndParsePricingFormula(leg.pricing_formula),
            mtm_formula: validateAndParsePricingFormula(leg.mtm_formula),
            right_side_product: leg.right_side_product,
            right_side_quantity: leg.right_side_quantity,
            right_side_period: leg.right_side_period,
            right_side_price: leg.right_side_price
          };
          
          const { error: insertLegError } = await supabase
            .from('paper_trade_legs')
            .insert(newLeg);
            
          if (insertLegError) {
            console.error(`Error creating paper trade leg: ${insertLegError.message}`);
          }
        }
      }
      
      // Small delay to avoid overwhelming the database
      await delay(100);
    }
    
    console.log('Paper trade migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error during paper trade migration:', error);
    toast.error("Migration failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

// Function to clean up old paper trades from physical_trades table after successful migration
export const cleanupPaperTradesFromPhysicalTable = async (): Promise<boolean> => {
  try {
    console.log('Starting cleanup of paper trades from physical_trades table');
    
    // First, fetch the paper trades to get their IDs
    const { data: paperTradesInPhysicalTable, error: fetchError } = await supabase
      .from('physical_trades')
      .select('id')
      .eq('trade_type', 'paper');
      
    if (fetchError) {
      throw new Error(`Error fetching paper trades: ${fetchError.message}`);
    }
    
    if (!paperTradesInPhysicalTable || paperTradesInPhysicalTable.length === 0) {
      console.log('No paper trades to clean up');
      return true;
    }
    
    const tradeIds = paperTradesInPhysicalTable.map(trade => trade.id);
    
    // Delete the legs first
    const { error: legDeleteError } = await supabase
      .from('physical_trade_legs')
      .delete()
      .in('parent_trade_id', tradeIds);
      
    if (legDeleteError) {
      throw new Error(`Error deleting paper trade legs: ${legDeleteError.message}`);
    }
    
    // Small delay to ensure legs are deleted before trades
    await delay(500);
    
    // Delete the paper trades from physical_trades
    const { error: tradeDeleteError } = await supabase
      .from('physical_trades')
      .delete()
      .in('id', tradeIds);
      
    if (tradeDeleteError) {
      throw new Error(`Error deleting paper trades: ${tradeDeleteError.message}`);
    }
    
    console.log(`Successfully cleaned up ${tradeIds.length} paper trades from physical_trades table`);
    return true;
  } catch (error) {
    console.error('Error during paper trade cleanup:', error);
    toast.error("Cleanup failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};
