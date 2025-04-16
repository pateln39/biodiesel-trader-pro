
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        assignment_date: new Date(assignment.assignment_date)
      }));
    },
    enabled: !!movementId
  });

  const createAssignmentsMutation = useMutation({
    mutationFn: async (assignments: TerminalAssignment[]) => {
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .insert(assignments.map(assignment => ({
          movement_id: movementId,
          terminal_id: assignment.terminal_id,
          quantity_mt: assignment.quantity_mt,
          assignment_date: assignment.assignment_date.toISOString().split('T')[0]
        })));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Terminal assignments saved successfully');
    },
    onError: (error) => {
      console.error('Error creating terminal assignments:', error);
      toast.error('Failed to save terminal assignments');
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
    createAssignments: (assignments: TerminalAssignment[]) => 
      createAssignmentsMutation.mutate(assignments),
    deleteAssignments: () => deleteAssignmentsMutation.mutate()
  };
};

export type { TerminalAssignment };
