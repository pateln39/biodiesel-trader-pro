
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BargeVessel {
  id: string;
  name: string;
  deadweight: number;
  imo_number: string;
  type: string | null;
  owners: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBargesVessels() {
  const queryClient = useQueryClient();

  const fetchBarges = async (): Promise<BargeVessel[]> => {
    const { data, error } = await supabase
      .from('barges_vessels')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching barges/vessels:', error);
      toast.error('Failed to load barges/vessels data');
      throw new Error(error.message);
    }
    
    return data || [];
  };

  const { data: barges = [], isLoading: loading, error } = useQuery({
    queryKey: ['bargesVessels'],
    queryFn: fetchBarges,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const getBarge = (bargeId: string): BargeVessel | undefined => {
    return barges.find(barge => barge.id === bargeId);
  };

  const getBargeByName = (bargeName: string): BargeVessel | undefined => {
    return barges.find(barge => barge.name === bargeName);
  };

  // Manual refetch function if needed
  const refetchBarges = () => {
    return queryClient.invalidateQueries({ queryKey: ['bargesVessels'] });
  };

  return {
    barges,
    loading,
    error: error instanceof Error ? error : null,
    fetchBarges: refetchBarges,
    getBarge,
    getBargeByName,
  };
}
