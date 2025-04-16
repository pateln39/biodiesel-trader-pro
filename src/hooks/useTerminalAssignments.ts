
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateForStorage } from '@/utils/dateUtils';

interface TerminalAssignment {
  id?: string;
  terminal_id: string;
  quantity_mt: number;
  assignment_date: Date;
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
      // First delete existing assignments
      const { error: deleteError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('movement_id', movementId);
      
      if (deleteError) throw deleteError;

      // Then insert new assignments
      const { error: insertError } = await supabase
        .from('movement_terminal_assignments')
        .insert(assignments.map(assignment => ({
          movement_id: movementId,
          terminal_id: assignment.terminal_id,
          quantity_mt: assignment.quantity_mt,
          // Use formatDateForStorage to ensure consistent date format without timezone issues
          assignment_date: formatDateForStorage(assignment.assignment_date)
        })));

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
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
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('movement_id', movementId);

      if (error) throw error;
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
