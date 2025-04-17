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

      // Group assignments by terminal_id
      const assignmentsByTerminal: Record<string, TerminalAssignment[]> = {};
      
      assignments.forEach((assignment) => {
        const terminalId = assignment.terminal_id;
        if (!assignmentsByTerminal[terminalId]) {
          assignmentsByTerminal[terminalId] = [];
        }
        assignmentsByTerminal[terminalId].push(assignment);
      });
      
      // For each terminal, get the highest existing sort_order
      const terminalMaxSortOrders: Record<string, number> = {};
      
      for (const terminalId in assignmentsByTerminal) {
        // Get the highest sort_order for this terminal
        const { data: maxOrderData, error: maxOrderError } = await supabase
          .from('movement_terminal_assignments')
          .select('sort_order')
          .eq('terminal_id', terminalId)
          .order('sort_order', { ascending: false })
          .limit(1);
        
        if (maxOrderError) throw maxOrderError;
        
        // If there are existing assignments, use the highest sort_order + 1
        // Otherwise, start from 1
        terminalMaxSortOrders[terminalId] = maxOrderData && maxOrderData.length > 0 && maxOrderData[0].sort_order
          ? maxOrderData[0].sort_order
          : 0;
      }
      
      // Prepare all assignments with proper terminal-specific sort_order values
      const assignmentsToInsert = [];
      
      for (const terminalId in assignmentsByTerminal) {
        const terminalAssignments = assignmentsByTerminal[terminalId];
        let currentSortOrder = terminalMaxSortOrders[terminalId];
        
        terminalAssignments.forEach((assignment) => {
          currentSortOrder++;
          assignmentsToInsert.push({
            movement_id: movementId,
            terminal_id: assignment.terminal_id,
            quantity_mt: assignment.quantity_mt,
            // Use formatDateForStorage to ensure consistent date format without timezone issues
            assignment_date: formatDateForStorage(assignment.assignment_date),
            comments: assignment.comments || null,
            sort_order: currentSortOrder // Sequential sort_order starting after the highest existing one
          });
        });
      }

      // Insert new assignments
      const { error: insertError } = await supabase
        .from('movement_terminal_assignments')
        .insert(assignmentsToInsert);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
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
      
      // First, delete all related tank movements to ensure proper cleanup
      const { error: tankMovementError } = await supabase
        .from('tank_movements')
        .delete()
        .eq('assignment_id', assignmentId);
      
      if (tankMovementError) {
        console.error('Error deleting related tank movements:', tankMovementError);
        // Continue with assignment deletion even if tank movements deletion fails
      }
      
      // Then delete the specific assignment
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
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
      
      // First, delete all related tank movements
      const { data: assignments } = await supabase
        .from('movement_terminal_assignments')
        .select('id')
        .eq('movement_id', movementId);
      
      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        
        // Delete tank movements for these assignments
        const { error: tankMovementError } = await supabase
          .from('tank_movements')
          .delete()
          .in('assignment_id', assignmentIds);
        
        if (tankMovementError) {
          console.error('Error deleting related tank movements:', tankMovementError);
          // Continue with assignment deletion even if tank movements deletion fails
        }
      }
      
      // Delete all assignments
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('movement_id', movementId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
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
