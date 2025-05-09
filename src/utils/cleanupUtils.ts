import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Cleans up orphaned tank movements that don't have valid assignment_id references
 * This is useful for fixing data inconsistencies in the database
 */
export const cleanupOrphanedTankMovements = async (terminalId: string): Promise<void> => {
  try {
    console.log('Cleaning up orphaned tank movements for terminal:', terminalId);
    
    // Get all tanks for this terminal
    const { data: tanks, error: tankError } = await supabase
      .from('tanks')
      .select('id')
      .eq('terminal_id', terminalId);
    
    if (tankError) throw tankError;
    if (!tanks || !tanks.length) {
      console.log('No tanks found for terminal, nothing to clean up');
      return;
    }
    
    const tankIds = tanks.map(t => t.id);
    
    // Find tank movements with invalid or missing assignment_id
    const { data: orphanedMovements, error: queryError } = await supabase
      .from('tank_movements')
      .select(`
        id,
        assignment_id,
        movement_id
      `)
      .in('tank_id', tankIds)
      .or('assignment_id.is.null,not.assignment_id.in.(select id from movement_terminal_assignments)');
    
    if (queryError) throw queryError;
    
    if (!orphanedMovements || !orphanedMovements.length) {
      console.log('No orphaned tank movements found');
      return;
    }
    
    console.log(`Found ${orphanedMovements.length} orphaned tank movements to clean up`);
    
    // Delete the orphaned movements
    const { error: deleteError } = await supabase
      .from('tank_movements')
      .delete()
      .in('id', orphanedMovements.map(m => m.id));
    
    if (deleteError) throw deleteError;
    
    toast.success(`Cleaned up ${orphanedMovements.length} orphaned tank movements`);
  } catch (error) {
    console.error('Error cleaning up orphaned tank movements:', error);
    toast.error('Failed to clean up orphaned tank movements');
  }
};

/**
 * Initialize sort_order for movement terminal assignments that have null values
 * This function ensures that sort_order values are unique per terminal
 */
export const initializeAssignmentSortOrder = async (terminalId?: string): Promise<void> => {
  try {
    if (terminalId) {
      // Initialize sort order for a specific terminal
      const { error } = await supabase.rpc('initialize_terminal_sort_order', { 
        p_terminal_id: terminalId 
      });
      
      if (error) throw error;
      
      toast.success('Initialized assignment sort order for selected terminal');
    } else {
      // Initialize sort order for all terminals
      const { error } = await supabase.rpc('initialize_all_terminal_sort_orders');
      
      if (error) throw error;
      
      toast.success('Initialized assignment sort order for all terminals');
    }
  } catch (error) {
    console.error('Error initializing assignment sort order:', error);
    toast.error('Failed to initialize assignment sort order');
  }
};

/**
 * Fix duplicate sort_order values within the same terminal
 */
export const fixDuplicateSortOrders = async (terminalId?: string): Promise<void> => {
  try {
    if (terminalId) {
      // Fix duplicates for a specific terminal
      const { error } = await supabase.rpc('fix_duplicate_sort_orders', { 
        p_terminal_id: terminalId 
      });
      
      if (error) throw error;
      
      toast.success('Fixed duplicate sort orders for selected terminal');
    } else {
      // Fix duplicates for all terminals
      const { error } = await supabase.rpc('fix_all_duplicate_sort_orders');
      
      if (error) throw error;
      
      toast.success('Fixed duplicate sort orders for all terminals');
    }
  } catch (error) {
    console.error('Error fixing duplicate sort orders:', error);
    toast.error('Failed to fix duplicate sort orders');
  }
};

/**
 * Initialize sort_order for movements within a specific terminal
 */
export const initializeMovementSortOrder = async (terminalId?: string): Promise<void> => {
  try {
    // If a terminal ID is provided, use that in the query
    let query;
    if (terminalId) {
      query = supabase.rpc('initialize_sort_order', {
        p_table_name: 'movements',
        p_terminal_id: terminalId
      });
    } else {
      query = supabase.rpc('initialize_sort_order', {
        p_table_name: 'movements'
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('[UTILS] Error in initializeMovementSortOrder:', error);
    throw error;
  }
};
