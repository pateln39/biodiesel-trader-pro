
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TankMovement } from './useInventoryState';

export const useTankMovements = (tankId?: string) => {
  const {
    data: tankMovements = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['tank_movements', tankId],
    queryFn: async () => {
      if (!tankId) return [];

      const { data, error } = await supabase
        .from('tank_movements')
        .select('*')
        .eq('tank_id', tankId)
        .order('movement_date', { ascending: true });

      if (error) throw error;

      return data.map((tm: any) => ({
        ...tm,
        movement_date: new Date(tm.movement_date),
        created_at: new Date(tm.created_at),
        updated_at: new Date(tm.updated_at)
      }));
    },
    enabled: !!tankId
  });

  const calculateBalance = () => {
    let balance = 0;
    return tankMovements.map(movement => {
      balance += movement.quantity_mt;
      return {
        ...movement,
        balance_mt: balance,
        balance_m3: balance * 1.1 // Using 1.1 as conversion factor
      };
    });
  };

  return {
    tankMovements: calculateBalance(),
    isLoading,
    error
  };
};
