
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  'TME': 'bg-purple-500 text-white',
  'UFAME': 'bg-orange-500 text-white',
  'PME': 'bg-red-500 text-white'
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

  // Update movement quantity mutation
  const updateMovementQuantityMutation = useMutation({
    mutationFn: async ({ movementId, quantity }: { movementId: string, quantity: number }) => {
      const { error } = await supabase
        .from('movements')
        .update({ actual_quantity: quantity })
        .eq('id', movementId);
      
      if (error) throw error;
      return { movementId, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Movement quantity updated');
    },
    onError: (error) => {
      console.error('Error updating movement quantity:', error);
      toast.error('Failed to update movement quantity');
    }
  });

  // Update movement comments mutation
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

  // Update tank product mutation
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
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank product updated');
    },
    onError: (error) => {
      console.error('Error updating tank product:', error);
      toast.error('Failed to update tank product');
    }
  });

  // Update tank spec mutation
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
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank spec updated');
    },
    onError: (error) => {
      console.error('Error updating tank spec:', error);
      toast.error('Failed to update tank spec');
    }
  });

  // Update tank heating mutation
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
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank heating updated');
    },
    onError: (error) => {
      console.error('Error updating tank heating:', error);
      toast.error('Failed to update tank heating');
    }
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

  return {
    movements,
    tankMovements,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    updateMovementQuantity: (movementId: string, quantity: number) => 
      updateMovementQuantityMutation.mutate({ movementId, quantity }),
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
    isLoading: loadingMovements || loadingTankMovements
  };
};
