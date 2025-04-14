
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Terminal {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const useTerminals = () => {
  const {
    data: terminals = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terminals')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data.map((terminal: any) => ({
        ...terminal,
        created_at: new Date(terminal.created_at),
        updated_at: new Date(terminal.updated_at)
      }));
    }
  });

  return { terminals, isLoading, error, refetchTerminals: refetch };
};
