import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MovementTerminalAssignment } from '@/types';
import { toast } from 'sonner';

interface InventoryState {
  terminalId: string | null;
  setTerminalId: (terminalId: string | null) => void;
  movementAssignments: MovementTerminalAssignment[];
  isLoading: boolean;
  error: Error | null;
  createStockReconciliation: (quantity: number, comment?: string) => Promise<any>;
  deleteStockReconciliation: (assignmentId: string) => Promise<void>;
  updateAssignmentSortOrder: (id: string, newSortOrder: number) => Promise<void>;
}

export const useInventoryState = (): InventoryState => {
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: movementAssignments = [], isLoading, error } = useQuery({
    queryKey: ['movementAssignments', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching movement assignments:', error);
        throw new Error(`Failed to fetch movement assignments: ${error.message}`);
      }

      return (data || []) as MovementTerminalAssignment[];
    },
    enabled: !!terminalId,
  });

  const createStockReconciliationMutation = useMutation({
    mutationFn: async ({ quantity, comment }: { quantity: number; comment?: string }) => {
      if (!terminalId) throw new Error('Terminal ID is required');
      
      console.log('Creating stock reconciliation for terminal:', terminalId, 'with quantity:', quantity);
      
      // First, get the current maximum sort_order for this terminal
      const { data: maxSortOrderData, error: maxSortOrderError } = await supabase
        .from('movement_terminal_assignments')
        .select('sort_order')
        .eq('terminal_id', terminalId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      if (maxSortOrderError) {
        throw new Error(`Failed to get max sort order: ${maxSortOrderError.message}`);
      }
      
      const maxOrder = maxSortOrderData?.[0]?.sort_order || 0;
      const newSortOrder = maxOrder + 1;
      
      // Get current date formatted for the record
      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Generate UUIDs for the new records
      const reconciliationMovementId = crypto.randomUUID();
      
      console.log('Creating reconciliation movement with ID:', reconciliationMovementId);
      
      // 1. Create the movement record - set sort_order to NULL since this is a reconciliation movement
      // and should not appear in the movements page
      const { error: movementError } = await supabase
        .from('movements')
        .insert({
          id: reconciliationMovementId,
          reference_number: `RECON-${reconciliationMovementId.slice(0, 6)}`,
          bl_quantity: quantity, // Use the provided quantity
          status: 'completed',
          product: 'RECONCILIATION',
          buy_sell: null, // Neutral, neither buy nor sell
          comments: comment,
          sort_order: null // Explicitly set to NULL to exclude from movements page
        });
      
      if (movementError) {
        console.error('Failed to create reconciliation movement:', movementError);
        throw new Error(`Failed to create stock reconciliation: ${movementError.message}`);
      }
      
      // 2. Create the terminal assignment
      const { error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .insert({
          terminal_id: terminalId,
          movement_id: reconciliationMovementId,
          quantity_mt: quantity, // Use the provided quantity
          assignment_date: formattedDate,
          comments: 'STOCK_RECONCILIATION', // Special identifier for reconciliation
          sort_order: newSortOrder
        });
      
      if (assignmentError) {
        console.error('Failed to create reconciliation assignment:', assignmentError);
        throw new Error(`Failed to create stock reconciliation assignment: ${assignmentError.message}`);
      }
      
      console.log('Successfully created stock reconciliation with ID:', reconciliationMovementId);
      return reconciliationMovementId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success('Stock reconciliation created', { 
        description: 'Stock reconciliation entry has been added successfully.'
      });
    },
    onError: (error) => {
      console.error('Error creating stock reconciliation:', error);
      toast.error('Failed to create stock reconciliation', {
        description: error.message
      });
    }
  });

  const deleteStockReconciliationMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      console.log('Deleting stock reconciliation assignment with ID:', assignmentId);

      // 1. Get the movement ID associated with the assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .select('movement_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) {
        console.error('Failed to get movement ID from assignment:', assignmentError);
        throw new Error(`Failed to get movement ID from assignment: ${assignmentError.message}`);
      }

      const movementId = assignmentData?.movement_id;

      // 2. Delete the terminal assignment
      const { error: deleteAssignmentError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteAssignmentError) {
        console.error('Failed to delete terminal assignment:', deleteAssignmentError);
        throw new Error(`Failed to delete terminal assignment: ${deleteAssignmentError.message}`);
      }

      // 3. Delete the movement record
      const { error: deleteMovementError } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId);

      if (deleteMovementError) {
        console.error('Failed to delete movement:', deleteMovementError);
        throw new Error(`Failed to delete movement: ${deleteMovementError.message}`);
      }

      console.log('Successfully deleted stock reconciliation assignment and movement with ID:', movementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success('Stock reconciliation deleted', {
        description: 'Stock reconciliation entry has been deleted successfully.'
      });
    },
    onError: (error) => {
      console.error('Error deleting stock reconciliation:', error);
      toast.error('Failed to delete stock reconciliation', {
        description: error.message
      });
    }
  });

  const updateAssignmentSortOrderMutation = useMutation({
    mutationFn: async ({
      id,
      newSortOrder,
    }: {
      id: string;
      newSortOrder: number;
    }) => {
      console.log(`Updating sort_order for assignment ${id} to ${newSortOrder}`);
      
      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .update({ sort_order: newSortOrder })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating sort_order:', error);
        throw error;
      }
      
      console.log(`Successfully updated sort_order for assignment ${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
    },
    onError: (error) => {
      console.error('Error in updateAssignmentSortOrderMutation:', error);
    }
  });

  const createStockReconciliation = async (quantity: number, comment?: string) => {
    return createStockReconciliationMutation.mutateAsync({ quantity, comment });
  };

  const deleteStockReconciliation = async (assignmentId: string) => {
    return deleteStockReconciliationMutation.mutateAsync(assignmentId);
  };

  const updateAssignmentSortOrder = async (id: string, newSortOrder: number) => {
    return updateAssignmentSortOrderMutation.mutateAsync({ id, newSortOrder });
  };

  return {
    terminalId,
    setTerminalId,
    movementAssignments,
    isLoading,
    error,
    createStockReconciliation,
    deleteStockReconciliation,
    updateAssignmentSortOrder,
  };
};
