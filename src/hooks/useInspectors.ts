import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Inspector {
  id: string;
  name: string;
}

// Fetch all inspectors
export const useInspectors = () => {
  const fetchInspectors = async (): Promise<Inspector[]> => {
    const { data, error } = await supabase
      .from('inspectors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  };

  return useQuery({
    queryKey: ['inspectors'],
    queryFn: fetchInspectors,
    refetchOnWindowFocus: false,
  });
};

// Add a new inspector
export const useAddInspector = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      // Check if inspector already exists
      const { data: existingInspector } = await supabase
        .from('inspectors')
        .select('id')
        .eq('name', name)
        .single();
      
      if (existingInspector) {
        // If it exists, return the existing one
        return existingInspector.id;
      }
      
      // Otherwise, create a new one
      const { data, error } = await supabase
        .from('inspectors')
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspectors'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add inspector",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
