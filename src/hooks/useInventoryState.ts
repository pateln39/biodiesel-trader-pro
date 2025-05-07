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
  'UCOME-5': 'bg-yellow-500 text-white',
  'TRANSFERS': 'bg-gray-500 text-white', // Changed from "Transfer" to "TRANSFERS" and kept gray-500
};

export const useInventoryState = (terminalId?: string) => {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['movements', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      // First, query the movement_terminal_assignments with their movements
      const { data: assignmentsData, error } = await supabase
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

      // Fetch all barges' IMO numbers to use for mapping
      const { data: bargesData, error: bargesError } = await supabase
        .from('barges_vessels')
        .select('name, imo_number');

      if (bargesError) {
        console.error('Error fetching barges data:', bargesError);
        throw bargesError;
      }

      // Create a map of barge name to IMO number for easy lookup
      const bargeImoMap = new Map();
      bargesData.forEach(barge => {
        bargeImoMap.set(barge.name, barge.imo_number);
      });
      
      // Process the returned data to ensure we always have movement data and IMO information
      return assignmentsData.map(assignment => {
        // If there's no movement data, create a default object with consistent properties
        if (!assignment.movements) {
          return {
            id: null, // Use null as a placeholder
            assignment_id: assignment.id,
            assignment_date: assignment.assignment_date,
            assignment_quantity: 0,
            terminal_comments: assignment.comments,
            sort_order: assignment.sort_order,
            barge_name: null,
            barge_imo: null,
            buy_sell: null,
            customs_status: null,
            created_at: assignment.created_at || new Date().toISOString(),
            updated_at: assignment.created_at || new Date().toISOString()
          };
        }
        
        // Get the IMO number from the map if the barge name exists
        const bargeImo = assignment.movements.barge_name ? 
          bargeImoMap.get(assignment.movements.barge_name) || 'Unknown' : 
          'N/A';

        // Return the complete movement data with IMO information
        return {
          ...assignment.movements,
          // Include the barge IMO number for display
          barge_imo: bargeImo,
          assignment_id: assignment.id,
          assignment_quantity: assignment.quantity_mt,
          assignment_date: assignment.assignment_date,
          terminal_comments: assignment.comments,
          sort_order: assignment.sort_order,
          // Ensure all required properties exist
          buy_sell: assignment.movements.buy_sell || null,
          customs_status: assignment.movements.customs_status || null,
          created_at: assignment.movements.created_at || assignment.created_at || new Date().toISOString(),
          updated_at: assignment.movements.updated_at || assignment.updated_at || new Date().toISOString()
        };
      }).filter(item => item !== null);
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
      const { data: tank } = await supabase
        .from('tanks')
        .select('display_order')
        .eq('id', tankId)
        .single();
      
      const { data, error } = await supabase
        .from('tanks')
        .update({ 
          current_product: product,
          display_order: tank?.display_order 
        })
        .eq('id', tankId)
        .select();
      
      if (error) throw error;
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
      const { data: tank } = await supabase
        .from('tanks')
        .select('display_order')
        .eq('id', tankId)
        .single();
      
      const { data, error } = await supabase
        .from('tanks')
        .update({ 
          spec,
          display_order: tank?.display_order 
        })
        .eq('id', tankId)
        .select();
      
      if (error) throw error;
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
      const { data: tank } = await supabase
        .from('tanks')
        .select('display_order')
        .eq('id', tankId)
        .single();
      
      const { data, error } = await supabase
        .from('tanks')
        .update({ 
          is_heating_enabled: isHeatingEnabled,
          display_order: tank?.display_order 
        })
        .eq('id', tankId)
        .select();
      
      if (error) throw error;
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
      const { data: tank } = await supabase
        .from('tanks')
        .select('display_order')
        .eq('id', tankId)
        .single();
      
      const capacityM3 = capacityMt * 1.1;
      const { data, error } = await supabase
        .from('tanks')
        .update({ 
          capacity_mt: capacityMt,
          capacity_m3: capacityM3,
          display_order: tank?.display_order 
        })
        .eq('id', tankId)
        .select();
      
      if (error) throw error;
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
        customs_status: movement.customs_status || null,
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

  const deletePumpOverMutation = useMutation({
    mutationFn: async ({ 
      assignmentId, 
      movementId 
    }: { 
      assignmentId: string, 
      movementId: string 
    }) => {
      console.log('Deleting pump over:', { assignmentId, movementId });
      
      // First, delete all tank movements related to this assignment
      const { error: tankMovementsError } = await supabase
        .from('tank_movements')
        .delete()
        .eq('assignment_id', assignmentId);
      
      if (tankMovementsError) throw tankMovementsError;
      
      // Next, delete the assignment record
      const { error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (assignmentError) throw assignmentError;
      
      // Finally, delete the movement record
      const { error: movementError } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId);
      
      if (movementError) throw movementError;
      
      return { assignmentId, movementId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      toast.success('Pump over deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting pump over:', error);
      toast.error(`Failed to delete pump over: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteStorageMovementMutation = useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => {
      console.log('Deleting storage movement assignment:', assignmentId);
      
      // First, delete all tank movements related to this assignment
      const { error: tankMovementsError } = await supabase
        .from('tank_movements')
        .delete()
        .eq('assignment_id', assignmentId);
      
      if (tankMovementsError) throw tankMovementsError;
      
      // Next, delete the assignment record
      const { error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (assignmentError) throw assignmentError;
      
      return { assignmentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      toast.success('Storage movement deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting storage movement:', error);
      toast.error(`Failed to delete storage movement: ${error.message || 'Unknown error'}`);
    }
  });

  const updateTankNumber = useMutation({
    mutationFn: async ({ tankId, tankNumber }: { tankId: string, tankNumber: string }) => {
      const { data: tank } = await supabase
        .from('tanks')
        .select('display_order')
        .eq('id', tankId)
        .single();
      
      const { data: existingTank, error: checkError } = await supabase
        .from('tanks')
        .select('id')
        .eq('terminal_id', terminalId)
        .eq('tank_number', tankNumber)
        .neq('id', tankId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingTank) {
        throw new Error('Tank number already exists');
      }
      
      const { data, error } = await supabase
        .from('tanks')
        .update({ 
          tank_number: tankNumber,
          display_order: tank?.display_order 
        })
        .eq('id', tankId)
        .select();
      
      if (error) throw error;
      return { tankId, tankNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      toast.success('Tank number updated');
    },
    onError: (error: any) => {
      console.error('Error updating tank number:', error);
      toast.error(error.message || 'Failed to update tank number');
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
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' }
  ];

  const createPumpOverMutation = useMutation({
    mutationFn: async ({ quantity, comment }: { quantity: number; comment?: string }) => {
      if (!terminalId) throw new Error('Terminal ID is required');
      
      console.log('Creating pump over for terminal:', terminalId, 'with quantity:', quantity);
      
      // First, get the current maximum sort_order for this terminal
      const { data: maxSortOrderData, error: maxSortOrderError } = await supabase
        .from('movement_terminal_assignments')
        .select('sort_order')
        .eq('terminal_id', terminalId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      if (maxSortOrderError) throw maxSortOrderError;
      
      // Calculate the new sort_order (max + 1, or 1 if no existing records)
      const maxSortOrder = maxSortOrderData && maxSortOrderData.length > 0 && maxSortOrderData[0].sort_order
        ? maxSortOrderData[0].sort_order
        : 0;
      
      const newSortOrder = maxSortOrder + 1;
      
      // Create a movement record for the pump over
      const pumpOverMovementId = crypto.randomUUID();
      const currentDate = new Date();
      const formattedDate = formatDateForStorage(currentDate);
      
      // Create a movement record for the pump over
      const { data: movementData, error: movementError } = await supabase
        .from('movements')
        .insert({
          id: pumpOverMovementId,
          reference_number: `PUMP-${pumpOverMovementId.slice(0, 6)}`,
          bl_quantity: quantity,
          status: 'completed',
          product: 'Transfer', // Generic product name for pump overs
          buy_sell: null, // Neutral, neither buy nor sell
          comments: comment || 'Internal tank transfer',
          terminal_id: terminalId,
          inventory_movement_date: formattedDate,
          sort_order: null // Explicitly setting sort_order to null for pump overs in movements table
        })
        .select()
        .single();
      
      if (movementError) throw movementError;
      
      // Then create the terminal assignment linked to this movement with the new sort_order
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .insert({
          terminal_id: terminalId,
          movement_id: pumpOverMovementId,
          quantity_mt: quantity,
          assignment_date: formattedDate,
          comments: 'PUMP_OVER', // Special identifier for pump overs
          sort_order: newSortOrder // Explicitly set the calculated sort_order
        })
        .select()
        .single();
      
      if (assignmentError) throw assignmentError;
      
      return { movementData, assignmentData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tank_movements'] });
      toast.success('Pump over created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating pump over:', error);
      toast.error(`Failed to create pump over: ${error.message || 'Unknown error'}`);
    }
  });

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
    updateTankNumber: (tankId: string, tankNumber: string) => 
      updateTankNumber.mutate({ tankId, tankNumber }),
    createPumpOver: (quantity: number, comment?: string) => createPumpOverMutation.mutate({ quantity, comment }),
    deletePumpOver: (assignmentId: string, movementId: string) => 
      deletePumpOverMutation.mutate({ assignmentId, movementId }),
    deleteStorageMovement: (assignmentId: string) => 
      deleteStorageMovementMutation.mutate({ assignmentId }),
    isLoading: loadingMovements || loadingTankMovements
  };
};
