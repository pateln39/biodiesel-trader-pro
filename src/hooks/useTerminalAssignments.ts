
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateForStorage } from '@/utils/dateUtils';

interface TerminalAssignment {
  id?: string;
  terminal_id: string;
  quantity_mt: number;
  assignment_date: Date;
  comments?: string;
}

export const useTerminalAssignments = (movementId: string) => {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['terminal-assignments', movementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .select('*')
        .eq('movement_id', movementId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data.map(assignment => ({
        ...assignment,
        // Ensure we create a new Date object without timezone adjustment
        assignment_date: new Date(assignment.assignment_date + 'T00:00:00')
      }));
    },
    enabled: !!movementId
  });

  const updateAssignmentsMutation = useMutation({
    mutationFn: async (assignments: TerminalAssignment[]) => {
      console.log('Updating terminal assignments:', assignments);
      
      // First get existing assignments to compare
      const { data: existingAssignments, error: fetchError } = await supabase
        .from('movement_terminal_assignments')
        .select('id, terminal_id, quantity_mt')
        .eq('movement_id', movementId);
      
      if (fetchError) throw fetchError;
      
      // Then delete existing assignments
      const { error: deleteError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('movement_id', movementId);
      
      if (deleteError) throw deleteError;

      // Also delete related tank movements to ensure they're recreated correctly
      const { error: deleteTankMovementsError } = await supabase
        .from('tank_movements')
        .delete()
        .eq('movement_id', movementId);
      
      if (deleteTankMovementsError) throw deleteTankMovementsError;

      // If no new assignments, we're done (all assignments were removed)
      if (assignments.length === 0) {
        return;
      }

      // Then insert new assignments
      const { error: insertError } = await supabase
        .from('movement_terminal_assignments')
        .insert(assignments.map(assignment => ({
          movement_id: movementId,
          terminal_id: assignment.terminal_id,
          quantity_mt: assignment.quantity_mt,
          // Use formatDateForStorage to ensure consistent date format without timezone issues
          assignment_date: formatDateForStorage(assignment.assignment_date),
          comments: assignment.comments || null
        })));

      if (insertError) throw insertError;

      // For each new assignment, get the tanks in that terminal and create tank movements
      for (const assignment of assignments) {
        // Get tanks for this terminal
        const { data: tanks, error: tanksError } = await supabase
          .from('tanks')
          .select('id, current_product')
          .eq('terminal_id', assignment.terminal_id);
        
        if (tanksError) throw tanksError;
        
        // Get movement details for customs status
        const { data: movement, error: movementError } = await supabase
          .from('movements')
          .select('customs_status, product')
          .eq('id', movementId)
          .single();
        
        if (movementError) throw movementError;
        
        // Create a default tank movement for the first tank only
        // In reality, users will distribute this quantity manually among tanks
        if (tanks.length > 0) {
          const defaultTank = tanks[0];
          const tankMovementData = {
            movement_id: movementId,
            tank_id: defaultTank.id,
            quantity_mt: assignment.quantity_mt,
            quantity_m3: assignment.quantity_mt * 1.1,
            product_at_time: defaultTank.current_product || movement.product,
            movement_date: formatDateForStorage(assignment.assignment_date),
            customs_status: movement.customs_status
          };
          
          const { error: tankMovementError } = await supabase
            .from('tank_movements')
            .insert([tankMovementData]);
          
          if (tankMovementError) throw tankMovementError;
        }
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Terminal assignments updated successfully');
    },
    onError: (error) => {
      console.error('Error updating terminal assignments:', error);
      toast.error('Failed to update terminal assignments');
    }
  });

  const deleteAssignmentsMutation = useMutation({
    mutationFn: async () => {
      console.log('Deleting all terminal assignments for movement:', movementId);
      
      // Also delete related tank movements
      const { error: deleteTankMovementsError } = await supabase
        .from('tank_movements')
        .delete()
        .eq('movement_id', movementId);
      
      if (deleteTankMovementsError) throw deleteTankMovementsError;
      
      // Delete the assignments
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('movement_id', movementId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Terminal assignments deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting terminal assignments:', error);
      toast.error('Failed to delete terminal assignments');
    }
  });

  return {
    assignments,
    isLoading,
    updateAssignments: (assignments: TerminalAssignment[]) => 
      updateAssignmentsMutation.mutate(assignments),
    deleteAssignments: () => deleteAssignmentsMutation.mutate()
  };
};

export type { TerminalAssignment };
