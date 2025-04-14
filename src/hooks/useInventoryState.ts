
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TankMovement {
  id: string;
  movement_id: string;
  tank_id: string;
  quantity_mt: number;
  quantity_m3: number;
  balance_mt: number;
  balance_m3: number;
  product_at_time: string;
  movement_date: Date;
  created_at: Date;
  updated_at: Date;
}

export const useInventoryState = (terminalId?: string) => {
  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['movements', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('inventory_movement_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!terminalId
  });

  const { data: tankMovements = [], isLoading: loadingTankMovements } = useQuery({
    queryKey: ['tank_movements', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('tank_movements')
        .select(`
          *,
          tanks!inner(terminal_id)
        `)
        .eq('tanks.terminal_id', terminalId)
        .order('movement_date', { ascending: true });

      if (error) throw error;

      return data.map((tm: any) => ({
        ...tm,
        movement_date: new Date(tm.movement_date),
        created_at: new Date(tm.created_at),
        updated_at: new Date(tm.updated_at)
      }));
    },
    enabled: !!terminalId
  });

  const productOptions = [
    { label: 'UCOME', value: 'UCOME' },
    { label: 'RME', value: 'RME' },
    { label: 'TME', value: 'TME' },
    { label: 'UFAME', value: 'UFAME' },
    { label: 'PME', value: 'PME' }
  ];

  const heatingOptions = [
    { label: 'Enabled', value: 'true' },
    { label: 'Disabled', value: 'false' }
  ];

  const PRODUCT_COLORS = {
    'UCOME': 'bg-blue-500 text-white',
    'RME': 'bg-green-500 text-white',
    'TME': 'bg-purple-500 text-white',
    'UFAME': 'bg-orange-500 text-white',
    'PME': 'bg-red-500 text-white'
  };

  return {
    movements,
    tankMovements,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    isLoading: loadingMovements || loadingTankMovements
  };
};
