import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TankMovement {
  id: string;
  movement_id: string;
  tank_id: string;
  quantity_mt: number;
  quantity_m3: number;
  product_at_time: string;
  movement_date: Date;
  created_at: Date;
  updated_at: Date;
  customs_status?: string;
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
        .from('movement_terminal_assignments')
        .select(`
          *,
          movements:movements(*)
        `)
        .eq('terminal_id', terminalId)
        .order('assignment_date', { ascending: true });

      if (error) {
        console.error('Error fetching movements:', error);
        throw error;
      }

      return data.map(assignment => ({
        ...assignment.movements,
        assignment_id: assignment.id,
        assignment_quantity: assignment.quantity_mt,
        assignment_date: assignment.assignment_date,
        terminal_comments: assignment.comments
      }));
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

      if (error) {
        console.error('Error fetching tank movements:', error);
        throw error;
      }

      return data.map((tm: any) => ({
        ...tm,
        movement_date: new Date(tm.movement_date),
        created_at: new Date(tm.created_at),
        updated_at: new Date(tm.updated_at)
      }));
    },
    enabled: !!terminalId
  });

  const calculateTankBalance = async (tankId: string, movementDate: Date) => {
    return {
      mt: 0,
      m3: 0
    };
  };

  const formatDateForStorage = (date: Date) => {
    return date.toISOString();
  };

  const updateMovementQuantityMutation = useMutation({
    mutationFn: async ({ movementId, quantity }: { movementId: string, quantity: number }) => {
      const { error: movementError } = await supabase
        .from('movements')
        .update({ actual_quantity: quantity })
        .eq('id', movementId);
      
      if (movementError) throw movementError;
      
      const movementDate = new Date();
      const { data: movement } = await supabase
        .from('movements')
        .select('terminal_id, product')
        .eq('id', movementId)
        .single();

      if (!movement?.terminal_id) throw new Error('No terminal found for movement');

      const { data: tanks } = await supabase
        .from('tanks')
        .select('*')
        .eq('terminal_id', movement.terminal_id);

      if (!tanks?.length) throw new Error('No tanks found for terminal');

      for (const tank of tanks) {
        const balance = await calculateTankBalance(tank.id, movementDate);
        const tankMovementData = {
          movement_id: movementId,
          tank_id: tank.id,
          quantity_mt: quantity,
          quantity_m3: quantity * 1.1,
          product_at_time: tank.current_product,
          movement_date: formatDateForStorage(movementDate)
        };

        const { error: tankMovementError } = await supabase
          .from('tank_movements')
          .insert([tankMovementData]);

        if (tankMovementError) throw tankMovementError;
      }

      return { movementId, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
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
      console.log('Attempting to update tank product:', { tankId, product });
      
      const { data, error } = await supabase
        .from('tanks')
        .update({ current_product: product })
        .eq('id', tankId)
        .select();
      
      if (error) {
        console.error('Detailed error updating tank product:', {
          message: error.message,
          details: error.details,
          code: error.code
        });
        throw error;
      }
      
      console.log('Tank product update response:', data);
      return { tankId, product };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      toast.success('Tank product updated');
    },
    onError: (error: any) => {
      console.error('Error updating tank product:', error);
      toast.error(`Failed to update tank product: ${error.message || 'Unknown error'}`);
    }
  });

  const updateTankSpecMutation = useMutation({
    mutationFn: async ({ tankId, spec }: { tankId: string, spec: string }) => {
      console.log('Attempting to update tank spec:', { tankId, spec });
      
      const { data, error } = await supabase
        .from('tanks')
        .update({ spec })
        .eq('id', tankId)
        .select();
      
      if (error) {
        console.error('Detailed error updating tank spec:', {
          message: error.message,
          details: error.details,
          code: error.code
        });
        throw error;
      }
      
      console.log('Tank spec update response:', data);
      return { tankId, spec };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank spec updated');
    },
    onError: (error: any) => {
      console.error('Error updating tank spec:', error);
      toast.error(`Failed to update tank spec: ${error.message || 'Unknown error'}`);
    }
  });

  const updateTankHeatingMutation = useMutation({
    mutationFn: async ({ tankId, isHeatingEnabled }: { tankId: string, isHeatingEnabled: boolean }) => {
      console.log('Attempting to update tank heating:', { tankId, isHeatingEnabled });
      
      const { data, error } = await supabase
        .from('tanks')
        .update({ is_heating_enabled: isHeatingEnabled })
        .eq('id', tankId)
        .select();
      
      if (error) {
        console.error('Detailed error updating tank heating:', {
          message: error.message,
          details: error.details,
          code: error.code
        });
        throw error;
      }
      
      console.log('Tank heating update response:', data);
      return { tankId, isHeatingEnabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank heating updated');
    },
    onError: (error: any) => {
      console.error('Error updating tank heating:', error);
      toast.error(`Failed to update tank heating: ${error.message || 'Unknown error'}`);
    }
  });

  const updateTankCapacityMutation = useMutation({
    mutationFn: async ({ tankId, capacityMt }: { tankId: string, capacityMt: number }) => {
      console.log('Attempting to update tank capacity:', { tankId, capacityMt });
      
      const capacityM3 = capacityMt * 1.1;
      const { data, error } = await supabase
        .from('tanks')
        .update({ 
          capacity_mt: capacityMt,
          capacity_m3: capacityM3
        })
        .eq('id', tankId)
        .select();
      
      if (error) {
        console.error('Detailed error updating tank capacity:', {
          message: error.message,
          details: error.details,
          code: error.code
        });
        throw error;
      }
      
      console.log('Tank capacity update response:', data);
      return { tankId, capacityMt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank capacity updated');
    },
    onError: (error: any) => {
      console.error('Error updating tank capacity:', error);
      toast.error(`Failed to update tank capacity: ${error.message || 'Unknown error'}`);
    }
  });

  const updateTankMovementMutation = useMutation({
    mutationFn: async ({ 
      movementId, 
      tankId, 
      quantity 
    }: { 
      movementId: string, 
      tankId: string, 
      quantity: number 
    }) => {
      const movement = movements.find(m => m.id === movementId);
      if (!movement) throw new Error('Movement not found');

      const { data: tankData, error: tankError } = await supabase
        .from('tanks')
        .select('current_product')
        .eq('id', tankId)
        .single();

      if (tankError) throw tankError;

      const tankMovementData = {
        movement_id: movementId,
        tank_id: tankId,
        quantity_mt: quantity,
        quantity_m3: quantity * 1.1,
        product_at_time: tankData.current_product,
        movement_date: movement.inventory_movement_date || new Date().toISOString(),
        customs_status: movement.customs_status
      };

      const { data: existing } = await supabase
        .from('tank_movements')
        .select('id')
        .eq('movement_id', movementId)
        .eq('tank_id', tankId)
        .maybeSingle();

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('tank_movements')
          .update(tankMovementData)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tank_movements')
          .insert([tankMovementData]);
        error = insertError;
      }

      if (error) throw error;
      return { movementId, tankId, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      toast.success('Movement quantity updated');
    },
    onError: (error: any) => {
      console.error('Error updating tank movement:', error);
      toast.error(`Failed to update movement quantity: ${error.message || 'Unknown error'}`);
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
    updateTankCapacity: (tankId: string, capacityMt: number) => 
      updateTankCapacityMutation.mutate({ tankId, capacityMt }),
    updateTankMovement: (movementId: string, tankId: string, quantity: number) =>
      updateTankMovementMutation.mutate({ movementId, tankId, quantity }),
    isLoading: loadingMovements || loadingTankMovements
  };
};
