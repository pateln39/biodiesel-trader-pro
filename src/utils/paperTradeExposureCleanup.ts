
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility function to clean up physical exposures from paper trade legs
 * This should be run once to migrate existing data
 */
export const cleanupPaperTradePhysicalExposures = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Fetch all paper trade legs that have exposures
    const { data: paperTradeLegs, error: fetchError } = await supabase
      .from('paper_trade_legs')
      .select('id, exposures')
      .not('exposures', 'is', null);
    
    if (fetchError) {
      throw new Error(`Error fetching paper trade legs: ${fetchError.message}`);
    }
    
    console.log(`[CLEANUP] Found ${paperTradeLegs?.length || 0} paper trade legs with exposures`);
    
    let updatedCount = 0;
    
    // Process each leg and remove physical exposures
    for (const leg of (paperTradeLegs || [])) {
      if (leg.exposures && typeof leg.exposures === 'object' && 'physical' in leg.exposures) {
        // Create a new exposures object without the physical key
        const { physical, ...otherExposures } = leg.exposures;
        
        // Update the leg with the new exposures
        const { error: updateError } = await supabase
          .from('paper_trade_legs')
          .update({ exposures: otherExposures })
          .eq('id', leg.id);
        
        if (updateError) {
          console.error(`[CLEANUP] Error updating leg ${leg.id}:`, updateError.message);
          continue;
        }
        
        updatedCount++;
      }
    }
    
    return { 
      success: true, 
      message: `Successfully cleaned up physical exposures from ${updatedCount} paper trade legs` 
    };
  } catch (error: any) {
    console.error('[CLEANUP] Error cleaning up paper trade physical exposures:', error);
    return { 
      success: false, 
      message: `Error cleaning up physical exposures: ${error.message}` 
    };
  }
};
