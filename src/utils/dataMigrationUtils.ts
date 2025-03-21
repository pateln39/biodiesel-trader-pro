
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Migrates paper trades from physical_trades and physical_trade_legs tables
 * to the new paper_trades and paper_trade_legs tables.
 * This is a one-time migration function.
 */
export const migratePaperTrades = async (): Promise<boolean> => {
  try {
    console.log('Starting paper trades migration');
    
    // 1. Fetch all paper trades from the physical_trades table
    const { data: paperTradesData, error: fetchError } = await supabase
      .from('physical_trades')
      .select('*')
      .eq('trade_type', 'paper');
      
    if (fetchError) {
      throw new Error(`Error fetching paper trades: ${fetchError.message}`);
    }
    
    console.log(`Found ${paperTradesData?.length || 0} paper trades to migrate`);
    
    if (!paperTradesData || paperTradesData.length === 0) {
      console.log('No paper trades to migrate');
      return true;
    }
    
    // 2. For each paper trade, migrate it and its legs
    for (const tradeToBeMigrated of paperTradesData) {
      // 2.1. Get trade legs
      const { data: tradeLegs, error: legsError } = await supabase
        .from('physical_trade_legs')
        .select('*')
        .eq('parent_trade_id', tradeToBeMigrated.id);
        
      if (legsError) {
        throw new Error(`Error fetching trade legs: ${legsError.message}`);
      }
      
      if (!tradeLegs || tradeLegs.length === 0) {
        console.warn(`Trade ${tradeToBeMigrated.id} has no legs, skipping`);
        continue;
      }
      
      // 2.2. Insert into paper_trades
      const { data: newPaperTrade, error: insertTradeError } = await supabase
        .from('paper_trades')
        .insert({
          id: tradeToBeMigrated.id, // Keep the same ID for reference
          trade_reference: tradeToBeMigrated.trade_reference,
          counterparty: tradeToBeMigrated.counterparty,
          comment: tradeToBeMigrated.comment,
          broker: tradeLegs[0].broker || 'Unknown', // Default if missing
          created_at: tradeToBeMigrated.created_at,
          updated_at: tradeToBeMigrated.updated_at
        })
        .select()
        .single();
        
      if (insertTradeError) {
        throw new Error(`Error inserting paper trade: ${insertTradeError.message}`);
      }
      
      console.log(`Migrated paper trade: ${tradeToBeMigrated.trade_reference}`);
      
      // 2.3. Insert legs into paper_trade_legs
      for (const leg of tradeLegs) {
        const { error: insertLegError } = await supabase
          .from('paper_trade_legs')
          .insert({
            id: leg.id, // Keep the same ID for reference
            parent_trade_id: leg.parent_trade_id,
            leg_reference: leg.leg_reference,
            buy_sell: leg.buy_sell,
            product: leg.product,
            quantity: leg.quantity,
            period: leg.trading_period || '', // Map to new column
            price: leg.price || 0,
            broker: leg.broker,
            relationship_type: leg.instrument?.includes('DIFF') ? 'DIFF' : 
                              leg.instrument?.includes('SPREAD') ? 'SPREAD' : 'FP',
            instrument: leg.instrument,
            formula: leg.pricing_formula,
            mtm_formula: leg.mtm_formula,
            // Extract right side info from mtm_formula if available
            right_side_product: leg.mtm_formula?.rightSide?.product,
            right_side_quantity: leg.mtm_formula?.rightSide?.quantity,
            right_side_period: leg.mtm_formula?.rightSide?.period,
            right_side_price: leg.mtm_formula?.rightSide?.price,
            created_at: leg.created_at,
            updated_at: leg.updated_at
          });
          
        if (insertLegError) {
          throw new Error(`Error inserting paper trade leg: ${insertLegError.message}`);
        }
      }
      
      console.log(`Migrated ${tradeLegs.length} legs for trade: ${tradeToBeMigrated.trade_reference}`);
    }
    
    console.log('Paper trades migration completed successfully');
    toast.success('Paper trades migrated successfully');
    return true;
    
  } catch (error) {
    console.error('Error in paper trades migration:', error);
    toast.error('Paper trades migration failed', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

/**
 * Cleans up paper trades from the physical_trades table after successful migration.
 * WARNING: Only call this after verifying that migration was successful.
 */
export const cleanupPaperTradesFromPhysicalTable = async (): Promise<boolean> => {
  try {
    console.log('Starting cleanup of paper trades from physical tables');
    
    // Delete paper trades from physical_trades
    const { error: deleteError } = await supabase
      .from('physical_trades')
      .delete()
      .eq('trade_type', 'paper');
      
    if (deleteError) {
      throw new Error(`Error deleting paper trades: ${deleteError.message}`);
    }
    
    console.log('Paper trades cleanup completed successfully');
    toast.success('Old paper trades data removed successfully');
    return true;
    
  } catch (error) {
    console.error('Error in paper trades cleanup:', error);
    toast.error('Paper trades cleanup failed', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};
