
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/integrations/supabase/client';

// Generate a unique trade reference
export const generateTradeReference = (): string => {
  // Format: YYMMDD-XXXXX where XXXXX is a random 5-digit number
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  
  return `${year}${month}${day}-${random}`;
};

// Generate a leg reference from a trade reference
export const generateLegReference = (tradeReference: string, legNumber: number): string => {
  const suffix = String.fromCharCode(97 + legNumber); // 0 -> 'a', 1 -> 'b', etc.
  return `${tradeReference}-${suffix}`;
};

// Format a leg reference for display
export const formatLegReference = (tradeReference: string, legReference: string): string => {
  // If the leg reference already contains the trade reference, just return the leg reference
  if (legReference && legReference.startsWith(tradeReference)) {
    return legReference;
  }
  
  // Otherwise, if there's a suffix in the leg reference, append it to the trade reference
  if (legReference && legReference.includes('-')) {
    const suffix = legReference.split('-').pop();
    return `${tradeReference}-${suffix}`;
  }
  
  // Fallback: just return the trade reference
  return tradeReference;
};

// Generate a movement reference number that includes the leg reference
export const generateMovementReference = (tradeReference: string, legReference: string, movementCount: number): string => {
  // The trade reference from open_trades should already include the leg suffix
  // Just append the movement count
  return `${tradeReference}-${movementCount}`;
};

// Format a movement reference for display
export const formatMovementReference = (tradeReference: string, legReference: string, movementNumber: string | number): string => {
  // The trade reference should already include the leg suffix
  // Check if the movement number already includes the reference
  if (typeof movementNumber === 'string' && movementNumber.includes(tradeReference)) {
    return movementNumber;
  }
  
  // Format with movement number appended
  return `${tradeReference}-${movementNumber}`;
};

// Format product display name based on relationship type (for Trades table UI)
export const formatProductDisplay = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  if (!product) return '';
  
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return `${product}/LSGO`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return `${product} SPREAD`;
    default:
      return product;
  }
};

// Format MTM formula display (for MTM calculations and formula display)
export const formatMTMDisplay = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  if (!product) return '';
  
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      return `${product} DIFF`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}-${rightSideProduct}`;
      }
      return `${product}`;
    default:
      return product;
  }
};

// Calculate open quantity for a trade
export const calculateOpenQuantity = (
  quantity: number, 
  tolerance: number,
  scheduledQuantity: number
): number => {
  const maxQuantity = quantity * (1 + tolerance / 100);
  return Math.max(0, maxQuantity - scheduledQuantity);
};

// Format a date to a standard display format
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Updated to exclude Paper column when calculating netExposure
export const calculateNetExposure = (
  physical: number,
  pricing: number
): number => {
  return physical + pricing;
};

// Generate instrument name from product and relationship type (for database storage)
export const generateInstrumentName = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      return `${product} DIFF`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}-${rightSideProduct} SPREAD`;
      }
      return `${product} SPREAD`;
    default:
      return product;
  }
};

// Function to check if a product is a pricing instrument
export const isPricingInstrument = (product: string): boolean => {
  const pricingInstruments = ['ICE GASOIL FUTURES', 'Platts LSGO', 'Platts Diesel'];
  return pricingInstruments.includes(product);
};

// Function to check if a trade is a term trade (has multiple legs)
export const isTermTrade = async (tradeId: string): Promise<boolean> => {
  try {
    // Count the legs associated with this parent trade
    const { data, error, count } = await supabase
      .from('trade_legs')
      .select('id', { count: 'exact', head: false })
      .eq('parent_trade_id', tradeId);
      
    if (error) {
      console.error('Error checking if trade is term trade:', error);
      throw new Error('Failed to check trade type');
    }
    
    // If count is more than 1, it's a term trade
    return (count || 0) > 1;
  } catch (error) {
    console.error('Error in isTermTrade:', error);
    return false; // Default to false on error
  }
};

// Function to copy a trade leg as a spot trade
export const copyTradeLegAsSpot = async (tradeId: string, legId: string): Promise<string | null> => {
  try {
    // 1. Get the parent trade details
    const { data: parentTradeData, error: parentTradeError } = await supabase
      .from('parent_trades')
      .select('*')
      .eq('id', tradeId)
      .single();
      
    if (parentTradeError || !parentTradeData) {
      console.error('Error fetching parent trade:', parentTradeError);
      throw new Error('Failed to fetch parent trade details');
    }
    
    // 2. Get the trade leg details
    const { data: legData, error: legError } = await supabase
      .from('trade_legs')
      .select('*')
      .eq('id', legId)
      .single();
      
    if (legError || !legData) {
      console.error('Error fetching trade leg:', legError);
      throw new Error('Failed to fetch trade leg details');
    }
    
    // 3. Generate a new trade reference
    const newTradeReference = generateTradeReference();
    
    // 4. Create a new parent trade (as a SPOT trade)
    const { data: newParentTradeData, error: newParentTradeError } = await supabase
      .from('parent_trades')
      .insert({
        trade_reference: newTradeReference,
        counterparty: parentTradeData.counterparty,
        trade_type: 'physical',
        physical_type: 'spot', // Always set to spot when copying a single leg
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();
      
    if (newParentTradeError || !newParentTradeData) {
      console.error('Error creating new parent trade:', newParentTradeError);
      throw new Error('Failed to create new trade');
    }
    
    // 5. Create a new trade leg
    // Omit id, parent_trade_id, created_at, updated_at from the original leg
    const { 
      id, 
      parent_trade_id, 
      created_at, 
      updated_at, 
      leg_reference, 
      ...legDataToCopy 
    } = legData;
    
    const newLegReference = generateLegReference(newTradeReference, 0);
    
    const { data: newLegData, error: newLegError } = await supabase
      .from('trade_legs')
      .insert({
        ...legDataToCopy,
        parent_trade_id: newParentTradeData.id,
        leg_reference: newLegReference,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();
      
    if (newLegError || !newLegData) {
      console.error('Error creating new trade leg:', newLegError);
      
      // Rollback - delete the parent trade we just created
      await supabase
        .from('parent_trades')
        .delete()
        .eq('id', newParentTradeData.id);
        
      throw new Error('Failed to create new trade leg');
    }
    
    return newTradeReference;
  } catch (error) {
    console.error('Error in copyTradeLegAsSpot:', error);
    throw error;
  }
};

// Function to copy an entire trade with all legs
export const copyEntireTrade = async (tradeId: string): Promise<string | null> => {
  try {
    // 1. Get the parent trade details
    const { data: parentTradeData, error: parentTradeError } = await supabase
      .from('parent_trades')
      .select('*')
      .eq('id', tradeId)
      .single();
      
    if (parentTradeError || !parentTradeData) {
      console.error('Error fetching parent trade:', parentTradeError);
      throw new Error('Failed to fetch parent trade details');
    }
    
    // 2. Get all trade legs associated with this parent trade
    const { data: legData, error: legError } = await supabase
      .from('trade_legs')
      .select('*')
      .eq('parent_trade_id', tradeId);
      
    if (legError || !legData || legData.length === 0) {
      console.error('Error fetching trade legs:', legError);
      throw new Error('Failed to fetch trade legs');
    }
    
    // 3. Generate a new trade reference
    const newTradeReference = generateTradeReference();
    
    // 4. Create a new parent trade (preserving original type)
    const { data: newParentTradeData, error: newParentTradeError } = await supabase
      .from('parent_trades')
      .insert({
        trade_reference: newTradeReference,
        counterparty: parentTradeData.counterparty,
        trade_type: parentTradeData.trade_type,
        physical_type: parentTradeData.physical_type, // Preserve term/spot type
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();
      
    if (newParentTradeError || !newParentTradeData) {
      console.error('Error creating new parent trade:', newParentTradeError);
      throw new Error('Failed to create new trade');
    }
    
    // 5. Create new trade legs for all original legs
    const newLegsData = legData.map((leg, index) => {
      // Omit id, parent_trade_id, created_at, updated_at from the original leg
      const { 
        id, 
        parent_trade_id, 
        created_at, 
        updated_at, 
        leg_reference, 
        ...legDataToCopy 
      } = leg;
      
      const newLegReference = generateLegReference(newTradeReference, index);
      
      return {
        ...legDataToCopy,
        parent_trade_id: newParentTradeData.id,
        leg_reference: newLegReference,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });
    
    const { data: newLegsDataResult, error: newLegsError } = await supabase
      .from('trade_legs')
      .insert(newLegsData)
      .select();
      
    if (newLegsError || !newLegsDataResult) {
      console.error('Error creating new trade legs:', newLegsError);
      
      // Rollback - delete the parent trade we just created
      await supabase
        .from('parent_trades')
        .delete()
        .eq('id', newParentTradeData.id);
        
      throw new Error('Failed to create new trade legs');
    }
    
    return newTradeReference;
  } catch (error) {
    console.error('Error in copyEntireTrade:', error);
    throw error;
  }
};
