
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TerminalAssignment } from './useTerminalAssignments';

export const useSortableTerminalAssignments = (terminalId?: string, movementId?: string) => {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['sortable-terminal-assignments', terminalId, movementId],
    queryFn: async () => {
      if (!terminalId && !movementId) return [];
      
      let query = supabase
        .from('movement_terminal_assignments')
        .select('*');
      
      if (terminalId) {
        query = query.eq('terminal_id', terminalId);
      }
      
      if (movementId) {
        query = query.eq('movement_id', movementId);
      }
      
      const { data, error } = await query.order('sort_order', { ascending: true, nullsFirst: false })
                                         .order('assignment_date', { ascending: true });

      if (error) throw error;
      return data.map(assignment => ({
        ...assignment,
        // Ensure we create a new Date object without timezone adjustment
        assignment_date: new Date(assignment.assignment_date + 'T00:00:00')
      }));
    },
    enabled: !!(terminalId || movementId)
  });

  const reorderAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, newOrder }: { assignmentId: string, newOrder: number }) => {
      console.log('Reordering assignment:', { assignmentId, newOrder });
      
      const { data, error } = await supabase.rpc('update_sort_order', {
        p_table_name: 'movement_terminal_assignments',
        p_id: assignmentId,
        p_new_sort_order: newOrder
      });
      
      if (error) throw error;
      return { assignmentId, newOrder };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      toast.success('Order updated successfully');
    },
    onError: (error: any) => {
      console.error('Error reordering assignment:', error);
      toast.error(`Failed to update order: ${error.message || 'Unknown error'}`);
    }
  });

  const handleReorder = (items: TerminalAssignment[]) => {
    // Apply the new order to the local state
    const updatedAssignments = [...items];
    
    // Update the sort order in the database for each changed item
    updatedAssignments.forEach((assignment, index) => {
      const currentIndex = assignments.findIndex(a => a.id === assignment.id);
      if (currentIndex !== index) {
        reorderAssignmentMutation.mutate({ assignmentId: assignment.id as string, newOrder: index + 1 });
      }
    });
    
    return updatedAssignments;
  };

  return {
    assignments,
    isLoading,
    error,
    handleReorder
  };
};
