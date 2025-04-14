
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tank {
  id: string;
  terminalId: string;
  tankNumber: string;
  currentProduct: string;
  capacityMt: number;
  capacityM3: number;
  spec?: string;
  isHeatingEnabled: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const useTanks = (terminalId?: string) => {
  const queryClient = useQueryClient();

  const fetchTanks = async (): Promise<Tank[]> => {
    try {
      let query = supabase
        .from('tanks')
        .select('*')
        .order('display_order', { ascending: true });

      if (terminalId) {
        query = query.eq('terminal_id', terminalId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(tank => ({
        id: tank.id,
        terminalId: tank.terminal_id,
        tankNumber: tank.tank_number,
        currentProduct: tank.current_product,
        capacityMt: Number(tank.capacity_mt),
        capacityM3: Number(tank.capacity_m3),
        spec: tank.spec,
        isHeatingEnabled: tank.is_heating_enabled,
        displayOrder: tank.display_order,
        createdAt: new Date(tank.created_at),
        updatedAt: new Date(tank.updated_at)
      }));
    } catch (error: any) {
      console.error('[TANKS] Error fetching tanks:', error);
      throw new Error(error.message);
    }
  };

  const { data: tanks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tanks', terminalId],
    queryFn: fetchTanks,
    enabled: terminalId !== undefined
  });

  const addTankMutation = useMutation({
    mutationFn: async (newTank: Omit<Tank, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Get current max display order
      const { data: existingTanks } = await supabase
        .from('tanks')
        .select('display_order')
        .eq('terminal_id', newTank.terminalId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingTanks?.length ? (existingTanks[0].display_order || 0) + 1 : 1;

      const { data, error } = await supabase
        .from('tanks')
        .insert({
          terminal_id: newTank.terminalId,
          tank_number: newTank.tankNumber,
          current_product: newTank.currentProduct,
          capacity_mt: newTank.capacityMt,
          capacity_m3: newTank.capacityM3,
          spec: newTank.spec,
          is_heating_enabled: newTank.isHeatingEnabled,
          display_order: nextDisplayOrder
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success(`Tank ${data.tank_number} added successfully`);
    },
    onError: (error: any) => {
      console.error('[TANKS] Error adding tank:', error);
      toast.error(`Failed to add tank: ${error.message}`);
    }
  });

  const updateTankMutation = useMutation({
    mutationFn: async (updatedTank: Partial<Tank> & { id: string }) => {
      const updateData: any = {};

      if (updatedTank.tankNumber !== undefined) updateData.tank_number = updatedTank.tankNumber;
      if (updatedTank.currentProduct !== undefined) updateData.current_product = updatedTank.currentProduct;
      if (updatedTank.capacityMt !== undefined) updateData.capacity_mt = updatedTank.capacityMt;
      if (updatedTank.capacityM3 !== undefined) updateData.capacity_m3 = updatedTank.capacityM3;
      if (updatedTank.spec !== undefined) updateData.spec = updatedTank.spec;
      if (updatedTank.isHeatingEnabled !== undefined) updateData.is_heating_enabled = updatedTank.isHeatingEnabled;
      if (updatedTank.displayOrder !== undefined) updateData.display_order = updatedTank.displayOrder;

      const { data, error } = await supabase
        .from('tanks')
        .update(updateData)
        .eq('id', updatedTank.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank updated successfully');
    },
    onError: (error: any) => {
      console.error('[TANKS] Error updating tank:', error);
      toast.error(`Failed to update tank: ${error.message}`);
    }
  });

  return {
    tanks,
    isLoading,
    error,
    refetch,
    addTank: addTankMutation.mutate,
    updateTank: updateTankMutation.mutate
  };
};
