
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Tank {
  id: string;
  terminal_id: string;
  tank_number: string;
  current_product: string;
  capacity_mt: number;
  capacity_m3: number;
  spec?: string;
  is_heating_enabled: boolean;
  display_order?: number;
  created_at: Date;
  updated_at: Date;
}

export const useTanks = (terminalId?: string) => {
  const {
    data: tanks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tanks', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('tanks')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('display_order');

      if (error) {
        console.error('Error fetching tanks:', error);
        throw error;
      }

      return data.map((tank: any) => ({
        ...tank,
        created_at: new Date(tank.created_at),
        updated_at: new Date(tank.updated_at)
      }));
    },
    enabled: !!terminalId
  });

  return { tanks, isLoading, error, refetchTanks: refetch };
};
