import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateForStorage } from '@/utils/dateUtils';

export interface TankMovement {
  id?: string;
  movement_id: string;
  tank_id: string;
  quantity_mt: number;
  quantity_m3: number;
  product_at_time: string;
  movement_date: Date;
  customs_status?: string;
  assignment_id?: string;
  sort_order?: number;
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
        .order('sort_order', { ascending: true, nullsFirst: false })
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
        terminal_comments: assignment.comments,
        sort_order: assignment.sort_order
      }));
    },
    enabled: !!terminalId,
    staleTime: 0
  });

  const { data: tankMovements = [], isLoading: loadingTankMovements } = useQuery({
    queryKey: ['tank_movements', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('tank_movements')
        .select(`
          *,
          tanks!inner(terminal_id),
          movement_terminal_assignments(sort_order)
        `)
        .eq('tanks.terminal_id', terminalId);

      if (error) {
        console.error('Error fetching tank movements:', error);
        throw error;
      }

      const processedData = data.map((tm: any) => ({
        ...tm,
        movement_date: new Date(tm.movement_date),
        created_at: new Date(tm.created_at),
        updated_at: new Date(tm.updated_at),
        sort_order: tm.sort_order !== null ? tm.sort_order : tm.movement_terminal_assignments?.sort_order || null
      }));

      return processedData.sort((a: any, b: any) => {
        if (a.sort_order !== null && b.sort_order !== null) {
          return a.sort_order - b.sort_order;
        }
        if (a.sort_order !== null) return -1;
        if (b.sort_order !== null) return 1;
        return a.movement_date.getTime() - b.movement_date.getTime();
      });
    },
    enabled: !!terminalId,
    staleTime: 0
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

  const updateAssignmentCommentsMutation = useMutation({
    mutationFn: async ({ assignmentId, comments }: { assignmentId: string, comments: string }) => {
      const { error } = await supabase
        .from('movement_terminal_assignments')
        .update({ comments })
        .eq('id', assignmentId);
      
      if (error) throw error;
      return { assignmentId, comments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
    },
    onError: (error) => {
      console.error('Error updating assignment comments:', error);
      toast.error('Failed to update comments');
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

      const assignmentId = movement.assignment_id;
      if (!assignmentId) {
        console.warn('No assignment ID found for movement:', movementId);
      }

      const sortOrder = movement.sort_order;

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
        movement_date: movement.assignment_date || new Date().toISOString(),
        customs_status: movement.customs_status,
        assignment_id: assignmentId,
        sort_order: sortOrder
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
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Movement quantity updated');
    },
    onError: (error: any) => {
      console.error('Error updating tank movement:', error);
      toast.error(`Failed to update movement quantity: ${error.message || 'Unknown error'}`);
    }
  });

  const createTankMovementMutation = useMutation({
    mutationFn: async ({ 
      terminalAssignmentId, 
      tankId, 
      quantity, 
      movementDate,
      customsStatus,
      product
    }: { 
      terminalAssignmentId: string, 
      tankId: string, 
      quantity: number,
      movementDate: Date,
      customsStatus?: string,
      product?: string  
    }) => {
      console.log('Creating tank movement:', { terminalAssignmentId, tankId, quantity });
      
      const { data: tankData, error: tankError } = await supabase
        .from('tanks')
        .select('current_product')
        .eq('id', tankId)
        .single();
      
      if (tankError) throw tankError;
      
      const { data: assignment, error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .select('movement_id, assignment_date, sort_order')
        .eq('id', terminalAssignmentId)
        .single();
        
      if (assignmentError) throw assignmentError;

      const assignmentDate = assignment.assignment_date ? new Date(assignment.assignment_date) : movementDate;

      const tankMovementData = {
        movement_id: assignment.movement_id,
        tank_id: tankId,
        quantity_mt: quantity,
        quantity_m3: quantity * 1.1,
        product_at_time: product || tankData.current_product,
        movement_date: formatDateForStorage(assignmentDate),
        customs_status: customsStatus,
        assignment_id: terminalAssignmentId,
        sort_order: assignment.sort_order
      };

      const { data: existingMovement } = await supabase
        .from('tank_movements')
        .select('id')
        .eq('assignment_id', terminalAssignmentId)
        .eq('tank_id', tankId)
        .maybeSingle();

      if (existingMovement) {
        const { error: updateError } = await supabase
          .from('tank_movements')
          .update(tankMovementData)
          .eq('id', existingMovement.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tank_movements')
          .insert([tankMovementData]);
        
        if (insertError) throw insertError;
      }

      return { terminalAssignmentId, tankId, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Tank movement updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating tank movement:', error);
      toast.error(`Failed to update tank movement: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteTankMovementMutation = useMutation({
    mutationFn: async ({ 
      terminalAssignmentId, 
      tankId 
    }: { 
      terminalAssignmentId: string, 
      tankId: string 
    }) => {
      console.log('Deleting tank movement:', { terminalAssignmentId, tankId });
      
      const { error } = await supabase
        .from('tank_movements')
        .delete()
        .eq('assignment_id', terminalAssignmentId)
        .eq('tank_id', tankId);
      
      if (error) throw error;
      
      return { terminalAssignmentId, tankId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Tank movement deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting tank movement:', error);
      toast.error(`Failed to delete tank movement: ${error.message || 'Unknown error'}`);
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
    updateAssignmentComments: (assignmentId: string, comments: string) => 
      updateAssignmentCommentsMutation.mutate({ assignmentId, comments }),
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
    createTankMovement: (
      terminalAssignmentId: string, 
      tankId: string, 
      quantity: number, 
      movementDate: Date,
      customsStatus?: string,
      product?: string
    ) => createTankMovementMutation.mutate({ 
      terminalAssignmentId, 
      tankId, 
      quantity, 
      movementDate,
      customsStatus,
      product
    }),
    deleteTankMovement: (terminalAssignmentId: string, tankId: string) => 
      deleteTankMovementMutation.mutate({ terminalAssignmentId, tankId }),
    isLoading: loadingMovements || loadingTankMovements
  };
};
