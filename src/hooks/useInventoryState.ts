
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateForStorage } from '@/utils/dateUtils';

export interface TankMovement {
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

export const PRODUCT_COLORS = {
  'UCOME': 'bg-blue-500 text-white',
  'RME': 'bg-green-500 text-white',
  'FAME0': 'bg-purple-500 text-white',
  'HVO': 'bg-orange-500 text-white',
  'RME DC': 'bg-red-500 text-white',
  'UCOME-5': 'bg-yellow-500 text-white'
};

export const useInventoryState = (terminalId?: string) => {
  const queryClient = useQueryClient();

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

  const updateMovementQuantityMutation = useMutation({
    mutationFn: async ({ 
      movementId, 
      tankId, 
      quantityMt, 
      product 
    }: { 
      movementId: string, 
      tankId: string, 
      quantityMt: number,
      product: string 
    }) => {
      // First, create a tank movement record
      const now = new Date();
      const { error: tankMovementError } = await supabase
        .from('tank_movements')
        .insert({
          movement_id: movementId,
          tank_id: tankId,
          quantity_mt: quantityMt,
          quantity_m3: quantityMt * 1.1, // Using 1.1 as conversion factor
          product_at_time: product,
          // Convert Date to string format expected by Supabase
          movement_date: formatDateForStorage(now)
        });
      
      if (tankMovementError) throw tankMovementError;

      // Then update the actual quantity in the movement
      const { error: movementError } = await supabase
        .from('movements')
        .update({ actual_quantity: quantityMt })
        .eq('id', movementId);
      
      if (movementError) throw movementError;
      
      return { movementId, tankId, quantityMt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements', terminalId] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements', terminalId] });
      toast.success('Movement quantity updated');
    },
    onError: (error) => {
      console.error('Error updating movement quantity:', error);
      toast.error('Failed to update movement quantity');
    }
  });

  const updateMovementCommentsMutation = useMutation({
    mutationFn: async ({ movementId, comments }: { movementId: string, comments: string }) => {
      const { error } = await supabase
        .from('movements')
        .update({ comments })
        .eq('id', movementId);
      
      if (error) throw error;
      return { movementId, comments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Comments updated');
    },
    onError: (error) => {
      console.error('Error updating comments:', error);
      toast.error('Failed to update comments');
    }
  });

  const updateTankProductMutation = useMutation({
    mutationFn: async ({ tankId, product }: { tankId: string, product: string }) => {
      const { error } = await supabase
        .from('tanks')
        .update({ current_product: product })
        .eq('id', tankId);
      
      if (error) throw error;
      return { tankId, product };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks', terminalId] });
      toast.success('Tank product updated');
    },
    onError: (error) => {
      console.error('Error updating tank product:', error);
      toast.error('Failed to update tank product');
    }
  });

  const updateTankSpecMutation = useMutation({
    mutationFn: async ({ tankId, spec }: { tankId: string, spec: string }) => {
      const { error } = await supabase
        .from('tanks')
        .update({ spec })
        .eq('id', tankId);
      
      if (error) throw error;
      return { tankId, spec };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks', terminalId] });
      toast.success('Tank spec updated');
    },
    onError: (error) => {
      console.error('Error updating tank spec:', error);
      toast.error('Failed to update tank spec');
    }
  });

  const updateTankHeatingMutation = useMutation({
    mutationFn: async ({ tankId, isHeatingEnabled }: { tankId: string, isHeatingEnabled: boolean }) => {
      const { error } = await supabase
        .from('tanks')
        .update({ is_heating_enabled: isHeatingEnabled })
        .eq('id', tankId);
      
      if (error) throw error;
      return { tankId, isHeatingEnabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks', terminalId] });
      toast.success('Tank heating updated');
    },
    onError: (error) => {
      console.error('Error updating tank heating:', error);
      toast.error('Failed to update tank heating');
    }
  });

  const updateTankCapacityMutation = useMutation({
    mutationFn: async ({ tankId, capacityMt }: { tankId: string, capacityMt: number }) => {
      const capacityM3 = capacityMt * 1.1; // Using 1.1 as conversion factor
      const { error } = await supabase
        .from('tanks')
        .update({ 
          capacity_mt: capacityMt,
          capacity_m3: capacityM3
        })
        .eq('id', tankId);
      
      if (error) throw error;
      return { tankId, capacityMt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks', terminalId] });
      toast.success('Tank capacity updated');
    },
    onError: (error) => {
      console.error('Error updating tank capacity:', error);
      toast.error('Failed to update tank capacity');
    }
  });

  const productOptions = [
    { label: 'UCOME', value: 'UCOME' },
    { label: 'RME', value: 'RME' },
    { label: 'FAME0', value: 'FAME0' },
    { label: 'HVO', value: 'HVO' },
    { label: 'RME DC', value: 'RME DC' },
    { label: 'UCOME-5', value: 'UCOME-5' }
  ];

  const heatingOptions = [
    { label: 'Enabled', value: 'true' },
    { label: 'Disabled', value: 'false' }
  ];

  return {
    movements,
    tankMovements,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    updateMovementQuantity: (movementId: string, tankId: string, quantityMt: number, product: string) => 
      updateMovementQuantityMutation.mutate({ movementId, tankId, quantityMt, product }),
    updateMovementComments: (movementId: string, comments: string) => 
      updateMovementCommentsMutation.mutate({ movementId, comments }),
    updateTankProduct: (tankId: string, product: string) => 
      updateTankProductMutation.mutate({ tankId, product }),
    updateTankSpec: (tankId: string, spec: string) => 
      updateTankSpecMutation.mutate({ tankId, spec }),
    updateTankHeating: (tankId: string, isHeatingEnabled: boolean | string) => 
      updateTankHeatingMutation.mutate({ 
        tankId, 
        isHeatingEnabled: typeof isHeatingEnabled === 'string' 
          ? isHeatingEnabled === 'true' 
          : isHeatingEnabled 
      }),
    updateTankCapacity: (tankId: string, capacityMt: number) => 
      updateTankCapacityMutation.mutate({ tankId, capacityMt }),
    isLoading: loadingMovements || loadingTankMovements
  };
};
