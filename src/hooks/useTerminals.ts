
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Terminal {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const useTerminals = () => {
  const queryClient = useQueryClient();

  const fetchTerminals = async (): Promise<Terminal[]> => {
    try {
      const { data, error } = await supabase
        .from('terminals')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data.map(terminal => ({
        id: terminal.id,
        name: terminal.name,
        description: terminal.description,
        isActive: terminal.is_active,
        createdAt: new Date(terminal.created_at),
        updatedAt: new Date(terminal.updated_at)
      }));
    } catch (error: any) {
      console.error('[TERMINALS] Error fetching terminals:', error);
      throw new Error(error.message);
    }
  };

  const { data: terminals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['terminals'],
    queryFn: fetchTerminals
  });

  const addTerminalMutation = useMutation({
    mutationFn: async (newTerminal: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('terminals')
        .insert({
          name: newTerminal.name,
          description: newTerminal.description,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
      toast.success('Terminal added successfully');
    },
    onError: (error: any) => {
      console.error('[TERMINALS] Error adding terminal:', error);
      toast.error(`Failed to add terminal: ${error.message}`);
    }
  });

  const updateTerminalMutation = useMutation({
    mutationFn: async (updatedTerminal: Partial<Terminal> & { id: string }) => {
      const { data, error } = await supabase
        .from('terminals')
        .update({
          name: updatedTerminal.name,
          description: updatedTerminal.description,
          is_active: updatedTerminal.isActive
        })
        .eq('id', updatedTerminal.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
      toast.success('Terminal updated successfully');
    },
    onError: (error: any) => {
      console.error('[TERMINALS] Error updating terminal:', error);
      toast.error(`Failed to update terminal: ${error.message}`);
    }
  });

  return {
    terminals,
    isLoading,
    error,
    refetch,
    addTerminal: addTerminalMutation.mutate,
    updateTerminal: updateTerminalMutation.mutate
  };
};
