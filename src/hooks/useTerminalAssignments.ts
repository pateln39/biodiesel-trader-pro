
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateForStorage } from '@/utils/dateUtils';

export interface TerminalAssignment {
  id?: string;
  terminal_id: string;
  quantity_mt: number;
  assignment_date: Date;
  comments?: string;
  sort_order?: number;
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
        .order('sort_order', { ascending: true, nullsFirst: false })
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
      // Note: This will also cascade delete the related tank_movements
      const { error: deleteError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('movement_id', movementId);
      
      if (deleteError) throw deleteError;

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

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      console.log('Deleting terminal assignment:', assignmentId);
      
      // Delete the specific assignment (tank movements will cascade delete)
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Terminal assignment deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting terminal assignment:', error);
      toast.error('Failed to delete terminal assignment');
    }
  });

  const deleteAssignmentsMutation = useMutation({
    mutationFn: async () => {
      console.log('Deleting all terminal assignments for movement:', movementId);
      
      // Delete all assignments (tank movements will cascade delete)
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
    deleteAssignment: (assignmentId: string) =>
      deleteAssignmentMutation.mutate(assignmentId),
    deleteAssignments: () => deleteAssignmentsMutation.mutate()
  };
};

// Removed duplicate export here
