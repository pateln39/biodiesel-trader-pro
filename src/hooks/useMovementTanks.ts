
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MovementTank {
  id: string;
  movementId: string;
  tankId: string;
  quantityMt: number;
  quantityM3: number;
  balanceMt: number;
  balanceM3: number;
  productAtTime: string;
}

export const useMovementTanks = (movementId?: string) => {
  const queryClient = useQueryClient();

  const fetchMovementTanks = async (): Promise<MovementTank[]> => {
    if (!movementId) return [];

    const { data, error } = await supabase
      .from('tank_movements')
      .select('*')
      .eq('movement_id', movementId);

    if (error) {
      throw error;
    }

    return data.map(tm => ({
      id: tm.id,
      movementId: tm.movement_id,
      tankId: tm.tank_id,
      quantityMt: Number(tm.quantity_mt),
      quantityM3: Number(tm.quantity_m3),
      balanceMt: Number(tm.balance_mt),
      balanceM3: Number(tm.balance_m3),
      productAtTime: tm.product_at_time
    }));
  };

  const { data: movementTanks = [], isLoading, error } = useQuery({
    queryKey: ['movementTanks', movementId],
    queryFn: fetchMovementTanks,
    enabled: !!movementId
  });

  const addMovementTankMutation = useMutation({
    mutationFn: async (newMovement: Omit<MovementTank, 'id'>) => {
      // Calculate or get balances if needed
      // Here we use the provided balance values from the parameter
      const { data, error } = await supabase
        .from('tank_movements')
        .insert({
          movement_id: newMovement.movementId,
          tank_id: newMovement.tankId,
          quantity_mt: newMovement.quantityMt,
          quantity_m3: newMovement.quantityM3,
          balance_mt: newMovement.balanceMt,
          balance_m3: newMovement.balanceM3,
          product_at_time: newMovement.productAtTime
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementTanks'] });
      toast.success('Tank movement added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add tank movement: ${error.message}`);
    }
  });

  return {
    movementTanks,
    isLoading,
    error,
    addMovementTank: addMovementTankMutation.mutate
  };
};
