
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TerminalAssignment {
  id?: string;
  movement_id?: string;
  terminal_id: string;
  quantity_mt: number;
  assignment_date: Date;
  comments?: string;
  created_at?: Date;
  updated_at?: Date;
  sort_order?: number;
}

export const useTerminalAssignments = (movementId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['terminal-assignments', movementId],
    queryFn: async () => {
      if (!movementId) return [];
      
      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .select('*')
        .eq('movement_id', movementId);
        
      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
      
      return data.map(assignment => ({
        ...assignment,
        assignment_date: assignment.assignment_date ? new Date(assignment.assignment_date) : new Date(),
      }));
    },
    enabled: !!movementId,
  });
  
  const updateAssignmentsMutation = useMutation({
    mutationFn: async (updatedAssignments: TerminalAssignment[]) => {
      if (!movementId) throw new Error('Movement ID is required');
      
      // Get existing assignments for this movement
      const { data: existingData, error: fetchError } = await supabase
        .from('movement_terminal_assignments')
        .select('id')
        .eq('movement_id', movementId);
        
      if (fetchError) throw fetchError;
      
      const existingIds = new Set(existingData.map(item => item.id));
      const updatedIds = new Set(updatedAssignments
        .filter(assignment => assignment.id)
        .map(assignment => assignment.id));
      
      // Find IDs to delete (exist in DB but not in updated list)
      const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id));
      
      // Delete removed assignments
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('movement_terminal_assignments')
          .delete()
          .in('id', idsToDelete);
          
        if (deleteError) throw deleteError;
      }
      
      // Process each assignment (update or insert)
      for (const assignment of updatedAssignments) {
        const assignmentData = {
          ...assignment,
          movement_id: movementId,
          assignment_date: assignment.assignment_date?.toISOString().split('T')[0]
        };
        
        if (assignment.id) {
          // Update existing assignment
          const { error: updateError } = await supabase
            .from('movement_terminal_assignments')
            .update(assignmentData)
            .eq('id', assignment.id);
            
          if (updateError) throw updateError;
        } else {
          // Insert new assignment
          const { error: insertError } = await supabase
            .from('movement_terminal_assignments')
            .insert([assignmentData]);
            
          if (insertError) throw insertError;
        }
      }
      
      return updatedAssignments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      toast.success('Terminal assignments updated successfully');
    },
    onError: (error) => {
      console.error('Error updating assignments:', error);
      toast.error('Failed to update terminal assignments');
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      // First delete any associated tank movements
      const { error: tankMovementError } = await supabase
        .from('tank_movements')
        .delete()
        .eq('assignment_id', assignmentId);
      
      if (tankMovementError) {
        console.error('Error deleting tank movements:', tankMovementError);
        throw tankMovementError;
      }
      
      // Then delete the assignment
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);
        
      if (error) {
        console.error('Error deleting assignment:', error);
        throw error;
      }
      
      return assignmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-assignments', movementId] });
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
    },
    onError: (error) => {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete terminal assignment');
    }
  });

  const updateAssignments = (updatedAssignments: TerminalAssignment[]) => {
    updateAssignmentsMutation.mutate(updatedAssignments);
  };
  
  const deleteAssignment = (assignmentId: string) => {
    return deleteAssignmentMutation.mutateAsync(assignmentId);
  };
  
  return {
    assignments,
    updateAssignments,
    deleteAssignment,
    isLoading,
    error
  };
};
