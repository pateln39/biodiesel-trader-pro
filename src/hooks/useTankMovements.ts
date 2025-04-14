
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TankMovement {
  id: string;
  movementId?: string;
  tankId: string;
  quantityMt: number;
  quantityM3: number;
  balanceMt: number;
  balanceM3: number;
  productAtTime: string;
  movementDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const useTankMovements = (tankId?: string, movementId?: string) => {
  const queryClient = useQueryClient();

  const fetchTankMovements = async (): Promise<TankMovement[]> => {
    try {
      let query = supabase
        .from('tank_movements')
        .select('*')
        .order('movement_date', { ascending: true });

      if (tankId) {
        query = query.eq('tank_id', tankId);
      }

      if (movementId) {
        query = query.eq('movement_id', movementId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(movement => ({
        id: movement.id,
        movementId: movement.movement_id,
        tankId: movement.tank_id,
        quantityMt: Number(movement.quantity_mt),
        quantityM3: Number(movement.quantity_m3),
        balanceMt: Number(movement.balance_mt),
        balanceM3: Number(movement.balance_m3),
        productAtTime: movement.product_at_time,
        movementDate: new Date(movement.movement_date),
        createdAt: new Date(movement.created_at),
        updatedAt: new Date(movement.updated_at)
      }));
    } catch (error: any) {
      console.error('[TANK MOVEMENTS] Error fetching tank movements:', error);
      throw new Error(error.message);
    }
  };

  const { data: tankMovements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tankMovements', tankId, movementId],
    queryFn: fetchTankMovements,
    enabled: tankId !== undefined || movementId !== undefined
  });

  const addMovementMutation = useMutation({
    mutationFn: async (newMovement: Omit<TankMovement, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Get current tank balance
      const { data: previousMovements } = await supabase
        .from('tank_movements')
        .select('*')
        .eq('tank_id', newMovement.tankId)
        .order('movement_date', { ascending: false })
        .limit(1);

      let previousBalanceMt = 0;
      let previousBalanceM3 = 0;

      if (previousMovements && previousMovements.length > 0) {
        previousBalanceMt = Number(previousMovements[0].balance_mt);
        previousBalanceM3 = Number(previousMovements[0].balance_m3);
      }

      // Calculate new balance
      const newBalanceMt = previousBalanceMt + newMovement.quantityMt;
      const newBalanceM3 = previousBalanceM3 + newMovement.quantityM3;

      const { data, error } = await supabase
        .from('tank_movements')
        .insert({
          movement_id: newMovement.movementId,
          tank_id: newMovement.tankId,
          quantity_mt: newMovement.quantityMt,
          quantity_m3: newMovement.quantityM3,
          balance_mt: newBalanceMt,
          balance_m3: newBalanceM3,
          product_at_time: newMovement.productAtTime,
          movement_date: newMovement.movementDate.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tankMovements'] });
    },
    onError: (error: any) => {
      console.error('[TANK MOVEMENTS] Error adding tank movement:', error);
      toast.error(`Failed to add tank movement: ${error.message}`);
    }
  });

  const updateMovementMutation = useMutation({
    mutationFn: async (updatedMovement: Partial<TankMovement> & { id: string }) => {
      const updateData: any = {};

      if (updatedMovement.quantityMt !== undefined) {
        updateData.quantity_mt = updatedMovement.quantityMt;
        
        // Get all subsequent movements to recalculate balances
        const { data: subsequentMovements } = await supabase
          .from('tank_movements')
          .select('*')
          .eq('tank_id', updatedMovement.tankId)
          .gte('movement_date', updatedMovement.movementDate?.toISOString() || new Date().toISOString())
          .order('movement_date', { ascending: true });
          
        if (subsequentMovements && subsequentMovements.length > 0) {
          // TODO: Implement recalculation of balances for subsequent movements
          // This would be a more complex operation requiring a transaction
          // For simplicity in this implementation, we'll just update the current movement
        }
      }
      
      if (updatedMovement.quantityM3 !== undefined) updateData.quantity_m3 = updatedMovement.quantityM3;
      if (updatedMovement.balanceMt !== undefined) updateData.balance_mt = updatedMovement.balanceMt;
      if (updatedMovement.balanceM3 !== undefined) updateData.balance_m3 = updatedMovement.balanceM3;
      if (updatedMovement.productAtTime !== undefined) updateData.product_at_time = updatedMovement.productAtTime;

      const { data, error } = await supabase
        .from('tank_movements')
        .update(updateData)
        .eq('id', updatedMovement.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tankMovements'] });
    },
    onError: (error: any) => {
      console.error('[TANK MOVEMENTS] Error updating tank movement:', error);
      toast.error(`Failed to update tank movement: ${error.message}`);
    }
  });

  return {
    tankMovements,
    isLoading,
    error,
    refetch,
    addMovement: addMovementMutation.mutate,
    updateMovement: updateMovementMutation.mutate
  };
};
