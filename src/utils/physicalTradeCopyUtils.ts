
import { supabase } from '@/integrations/supabase/client';
import { generateTradeReference } from '@/utils/tradeUtils';

/**
 * Copies a physical trade to create a new trade with the same details but a new reference
 * @param tradeId The ID of the parent trade to copy
 * @returns The new trade reference
 */
export const copyPhysicalTrade = async (tradeId: string): Promise<string> => {
  try {
    // Fetch the parent trade data
    const { data: parentTradeData, error: parentTradeError } = await supabase
      .from('parent_trades')
      .select('*')
      .eq('id', tradeId)
      .single();
    
    if (parentTradeError) {
      throw new Error(`Error fetching parent trade: ${parentTradeError.message}`);
    }
    
    if (!parentTradeData) {
      throw new Error('Trade not found');
    }
    
    // Fetch the trade legs
    const { data: tradeLegs, error: tradeLegsError } = await supabase
      .from('trade_legs')
      .select('*')
      .eq('parent_trade_id', tradeId);
      
    if (tradeLegsError) {
      throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
    }
    
    // Generate a new trade reference
    const newTradeReference = generateTradeReference();
    
    // Create a new parent trade with the new reference
    const newParentTrade = {
      ...parentTradeData,
      id: undefined, // Let Supabase generate a new ID
      trade_reference: newTradeReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the new parent trade
    const { data: newParentTradeData, error: newParentTradeError } = await supabase
      .from('parent_trades')
      .insert(newParentTrade)
      .select('id')
      .single();
      
    if (newParentTradeError) {
      throw new Error(`Error creating new parent trade: ${newParentTradeError.message}`);
    }
    
    // Create new legs for each original leg
    const newTradeLegs = tradeLegs.map((leg, index) => {
      // Determine if this is the main leg (which should have the same reference as the parent)
      const isMainLeg = leg.leg_reference === parentTradeData.trade_reference;
      
      // Generate the appropriate leg reference
      const newLegReference = isMainLeg 
        ? newTradeReference 
        : `${newTradeReference}-${String.fromCharCode(97 + index)}`;
      
      return {
        ...leg,
        id: undefined, // Let Supabase generate a new ID
        parent_trade_id: newParentTradeData.id,
        leg_reference: newLegReference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    // Insert the new legs
    const { error: newLegsError } = await supabase
      .from('trade_legs')
      .insert(newTradeLegs);
      
    if (newLegsError) {
      throw new Error(`Error creating new trade legs: ${newLegsError.message}`);
    }
    
    return newTradeReference;
  } catch (error) {
    console.error('Error in copyPhysicalTrade:', error);
    throw error;
  }
};
