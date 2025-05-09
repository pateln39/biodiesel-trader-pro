import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MovementTerminalAssignment, TankMovement } from '@/types';
import { toast } from 'sonner';

// Product color mapping
export const PRODUCT_COLORS: Record<string, string> = {
  'GASOIL 10PPM': 'bg-green-500 text-white',
  'GASOIL 50PPM': 'bg-emerald-500 text-white',
  'GASOIL 10': 'bg-lime-500 text-white',
  'GASOIL EN590': 'bg-teal-500 text-white',
  'GASOIL 1000PPM': 'bg-amber-500 text-white',
  'JET': 'bg-blue-500 text-white',
  'MOGAS': 'bg-red-500 text-white',
  'NAPHTHA': 'bg-purple-500 text-white',
  'TRANSFER': 'bg-gray-500 text-white',
  'RECONCILIATION': 'bg-violet-500 text-white',
  'EMPTY': 'bg-gray-300 text-gray-700'
};

// Interface for tank movement and terminal data
interface Movement {
  id: string;
  reference_number: string;
  bl_quantity: number;
  status: string;
  product: string;
  buy_sell: string | null;
  assignment_id: string;
  assignment_quantity: number | null;
  assignment_date: string | null;
  terminal_comments: string | null;
  sort_order: number | null;
  created_at: string;
}

interface InventoryState {
  terminalId: string | null;
  setTerminalId: (terminalId: string | null) => void;
  movementAssignments: MovementTerminalAssignment[];
  movements: Movement[];
  tankMovements: TankMovement[];
  productOptions: { value: string; label: string }[];
  heatingOptions: { value: string; label: string }[];
  PRODUCT_COLORS: Record<string, string>;
  isLoading: boolean;
  error: Error | null;
  createStockReconciliation: (quantity: number, comment?: string) => Promise<any>;
  deleteStockReconciliation: (assignmentId: string) => Promise<void>;
  updateAssignmentSortOrder: (id: string, newSortOrder: number) => Promise<void>;
  updateTankMovement: (movementId: string, tankId: string, quantity: number) => Promise<any>;
  updateMovementQuantity: (id: string, quantity: number) => Promise<any>;
  updateAssignmentComments: (id: string, comments: string) => Promise<any>;
  updateTankProduct: (id: string, product: string) => Promise<any>;
  updateTankSpec: (id: string, spec: string) => Promise<any>;
  updateTankHeating: (id: string, isHeating: string) => Promise<any>;
  updateTankCapacity: (id: string, capacity: number) => Promise<any>;
  updateTankNumber: (id: string, tankNumber: string) => Promise<any>;
  createPumpOver: (quantity: number, comment?: string) => Promise<any>;
  deletePumpOver: (assignmentId: string, movementId: string) => Promise<void>;
  deleteStorageMovement: (assignmentId: string) => Promise<void>;
}

export const useInventoryState = (selectedTerminalId?: string | null): InventoryState => {
  const [terminalId, setTerminalId] = useState<string | null>(selectedTerminalId || null);
  const queryClient = useQueryClient();

  // Define product options for dropdowns
  const productOptions = Object.keys(PRODUCT_COLORS).map(product => ({
    value: product,
    label: product
  }));
  
  // Heating options
  const heatingOptions = [
    { value: "true", label: "Enabled" },
    { value: "false", label: "Disabled" }
  ];

  const { data: movementAssignments = [], isLoading, error } = useQuery({
    queryKey: ['movementAssignments', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching movement assignments:', error);
        throw new Error(`Failed to fetch movement assignments: ${error.message}`);
      }

      return (data || []) as MovementTerminalAssignment[];
    },
    enabled: !!terminalId,
  });

  // Fetch movements
  const { data: movements = [] } = useQuery({
    queryKey: ['terminalMovements', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .select(`
          movement_id,
          quantity_mt,
          assignment_date,
          comments,
          sort_order,
          movements (
            id,
            reference_number,
            bl_quantity,
            status,
            product,
            buy_sell,
            created_at
          )
        `)
        .eq('terminal_id', terminalId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching terminal movements:', error);
        throw new Error(`Failed to fetch terminal movements: ${error.message}`);
      }

      // Transform the data to flatten the structure
      return (data || []).map((item: any) => ({
        id: item.movements?.id,
        reference_number: item.movements?.reference_number,
        bl_quantity: item.movements?.bl_quantity,
        status: item.movements?.status,
        product: item.movements?.product,
        buy_sell: item.movements?.buy_sell,
        assignment_id: item.id,
        assignment_quantity: item.quantity_mt,
        assignment_date: item.assignment_date,
        terminal_comments: item.comments,
        sort_order: item.sort_order,
        created_at: item.movements?.created_at,
      })).filter((item: any) => item.id); // Filter out items without movement data
    },
    enabled: !!terminalId,
  });

  // Fetch tank movements
  const { data: tankMovements = [] } = useQuery({
    queryKey: ['tankMovements', terminalId],
    queryFn: async () => {
      if (!terminalId) return [];

      const { data, error } = await supabase
        .from('tank_movements')
        .select('*, tanks!inner(terminal_id)')
        .eq('tanks.terminal_id', terminalId);

      if (error) {
        console.error('Error fetching tank movements:', error);
        throw new Error(`Failed to fetch tank movements: ${error.message}`);
      }

      return (data || []) as TankMovement[];
    },
    enabled: !!terminalId,
  });

  // Create stock reconciliation mutation 
  const createStockReconciliationMutation = useMutation({
    mutationFn: async ({ quantity, comment }: { quantity: number; comment?: string }) => {
      if (!terminalId) throw new Error('Terminal ID is required');
      
      console.log('Creating stock reconciliation for terminal:', terminalId, 'with quantity:', quantity);
      
      // First, get the current maximum sort_order for this terminal
      const { data: maxSortOrderData, error: maxSortOrderError } = await supabase
        .from('movement_terminal_assignments')
        .select('sort_order')
        .eq('terminal_id', terminalId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      if (maxSortOrderError) {
        throw new Error(`Failed to get max sort order: ${maxSortOrderError.message}`);
      }
      
      const maxOrder = maxSortOrderData?.[0]?.sort_order || 0;
      const newSortOrder = maxOrder + 1;
      
      // Get current date formatted for the record
      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Generate UUIDs for the new records
      const reconciliationMovementId = crypto.randomUUID();
      
      console.log('Creating reconciliation movement with ID:', reconciliationMovementId);
      
      // 1. Create the movement record - set sort_order to NULL since this is a reconciliation movement
      // and should not appear in the movements page
      const { error: movementError } = await supabase
        .from('movements')
        .insert({
          id: reconciliationMovementId,
          reference_number: `RECON-${reconciliationMovementId.slice(0, 6)}`,
          bl_quantity: quantity, // Use the provided quantity
          status: 'completed',
          product: 'RECONCILIATION',
          buy_sell: null, // Neutral, neither buy nor sell
          comments: comment,
          sort_order: null // Explicitly set to NULL to exclude from movements page
        });
      
      if (movementError) {
        console.error('Failed to create reconciliation movement:', movementError);
        throw new Error(`Failed to create stock reconciliation: ${movementError.message}`);
      }
      
      // 2. Create the terminal assignment
      const { error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .insert({
          terminal_id: terminalId,
          movement_id: reconciliationMovementId,
          quantity_mt: quantity, // Use the provided quantity
          assignment_date: formattedDate,
          comments: 'STOCK_RECONCILIATION', // Special identifier for reconciliation
          sort_order: newSortOrder
        });
      
      if (assignmentError) {
        console.error('Failed to create reconciliation assignment:', assignmentError);
        throw new Error(`Failed to create stock reconciliation assignment: ${assignmentError.message}`);
      }
      
      console.log('Successfully created stock reconciliation with ID:', reconciliationMovementId);
      return reconciliationMovementId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success('Stock reconciliation created', { 
        description: 'Stock reconciliation entry has been added successfully.'
      });
    },
    onError: (error) => {
      console.error('Error creating stock reconciliation:', error);
      toast.error('Failed to create stock reconciliation', {
        description: error.message
      });
    }
  });

  // Delete stock reconciliation mutation
  const deleteStockReconciliationMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      console.log('Deleting stock reconciliation assignment with ID:', assignmentId);

      // 1. Get the movement ID associated with the assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .select('movement_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) {
        console.error('Failed to get movement ID from assignment:', assignmentError);
        throw new Error(`Failed to get movement ID from assignment: ${assignmentError.message}`);
      }

      const movementId = assignmentData?.movement_id;

      // 2. Delete the terminal assignment
      const { error: deleteAssignmentError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteAssignmentError) {
        console.error('Failed to delete terminal assignment:', deleteAssignmentError);
        throw new Error(`Failed to delete terminal assignment: ${deleteAssignmentError.message}`);
      }

      // 3. Delete the movement record
      const { error: deleteMovementError } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId);

      if (deleteMovementError) {
        console.error('Failed to delete movement:', deleteMovementError);
        throw new Error(`Failed to delete movement: ${deleteMovementError.message}`);
      }

      console.log('Successfully deleted stock reconciliation assignment and movement with ID:', movementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success('Stock reconciliation deleted', {
        description: 'Stock reconciliation entry has been deleted successfully.'
      });
    },
    onError: (error) => {
      console.error('Error deleting stock reconciliation:', error);
      toast.error('Failed to delete stock reconciliation', {
        description: error.message
      });
    }
  });

  // Update assignment sort order mutation
  const updateAssignmentSortOrderMutation = useMutation({
    mutationFn: async ({
      id,
      newSortOrder,
    }: {
      id: string;
      newSortOrder: number;
    }) => {
      console.log(`Updating sort_order for assignment ${id} to ${newSortOrder}`);
      
      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .update({ sort_order: newSortOrder })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating sort_order:', error);
        throw error;
      }
      
      console.log(`Successfully updated sort_order for assignment ${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
    },
    onError: (error) => {
      console.error('Error in updateAssignmentSortOrderMutation:', error);
    }
  });

  // Tank movement update mutation
  const updateTankMovementMutation = useMutation({
    mutationFn: async ({ movementId, tankId, quantity }: { movementId: string, tankId: string, quantity: number }) => {
      const { data, error } = await supabase
        .from('tank_movements')
        .upsert(
          { 
            movement_id: movementId,
            tank_id: tankId,
            quantity_mt: quantity,
            // We calculate quantity_m3 on the server or would need density
            quantity_m3: quantity * 1.1 // Simplified calculation, replace with actual logic if needed
          },
          { onConflict: 'movement_id,tank_id' }
        )
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tankMovements'] });
    }
  });
  
  // Movement quantity update mutation
  const updateMovementQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string, quantity: number }) => {
      const { data, error } = await supabase
        .from('movements')
        .update({ bl_quantity: quantity })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
    }
  });
  
  // Assignment comments update mutation
  const updateAssignmentCommentsMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string, comments: string }) => {
      const { data, error } = await supabase
        .from('movement_terminal_assignments')
        .update({ comments })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
    }
  });
  
  // Tank update mutations
  const updateTankProductMutation = useMutation({
    mutationFn: async ({ id, product }: { id: string, product: string }) => {
      const { data, error } = await supabase
        .from('tanks')
        .update({ current_product: product })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
    }
  };
  
  const updateTankSpecMutation = useMutation({
    mutationFn: async ({ id, spec }: { id: string, spec: string }) => {
      const { data, error } = await supabase
        .from('tanks')
        .update({ spec })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
    }
  };
  
  const updateTankHeatingMutation = useMutation({
    mutationFn: async ({ id, isHeating }: { id: string, isHeating: string }) => {
      const { data, error } = await supabase
        .from('tanks')
        .update({ is_heating_enabled: isHeating === 'true' })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
    }
  };
  
  const updateTankCapacityMutation = useMutation({
    mutationFn: async ({ id, capacity }: { id: string, capacity: number }) => {
      const { data, error } = await supabase
        .from('tanks')
        .update({ 
          capacity_mt: capacity,
          capacity_m3: capacity * 1.1 // Simplified calculation, replace with actual logic if needed
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
    }
  };
  
  const updateTankNumberMutation = useMutation({
    mutationFn: async ({ id, tankNumber }: { id: string, tankNumber: string }) => {
      const { data, error } = await supabase
        .from('tanks')
        .update({ tank_number: tankNumber })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
    }
  };
  
  // Create pump over mutation
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
      
      if (maxSortOrderError) {
        throw new Error(`Failed to get max sort order: ${maxSortOrderError.message}`);
      }
      
      const maxOrder = maxSortOrderData?.[0]?.sort_order || 0;
      const newSortOrder = maxOrder + 1;
      
      // Get current date formatted for the record
      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Generate UUIDs for the new records
      const pumpOverMovementId = crypto.randomUUID();
      
      console.log('Creating pump over movement with ID:', pumpOverMovementId);
      
      // 1. Create the movement record - set sort_order to NULL since this is a pump over movement
      // and should not appear in the movements page
      const { error: movementError } = await supabase
        .from('movements')
        .insert({
          id: pumpOverMovementId,
          reference_number: `PUMP-${pumpOverMovementId.slice(0, 6)}`,
          bl_quantity: quantity, // Use the provided quantity
          status: 'completed',
          product: 'PUMP_OVER',
          buy_sell: null, // Neutral, neither buy nor sell
          comments: comment,
          sort_order: null // Explicitly set to NULL to exclude from movements page
        });
      
      if (movementError) {
        console.error('Failed to create pump over movement:', movementError);
        throw new Error(`Failed to create pump over: ${movementError.message}`);
      }
      
      // 2. Create the terminal assignment
      const { error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .insert({
          terminal_id: terminalId,
          movement_id: pumpOverMovementId,
          quantity_mt: quantity, // Use the provided quantity
          assignment_date: formattedDate,
          comments: 'PUMP_OVER', // Special identifier for pump over
          sort_order: newSortOrder
        });
      
      if (assignmentError) {
        console.error('Failed to create pump over assignment:', assignmentError);
        throw new Error(`Failed to create pump over assignment: ${assignmentError.message}`);
      }
      
      console.log('Successfully created pump over with ID:', pumpOverMovementId);
      return pumpOverMovementId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success('Pump over created', { 
        description: 'Internal pump over has been created successfully.'
      });
    },
    onError: (error) => {
      console.error('Error creating pump over:', error);
      toast.error('Failed to create pump over', {
        description: error.message
      });
    }
  });
  
  // Delete pump over mutation
  const deletePumpOverMutation = useMutation({
    mutationFn: async ({ assignmentId, movementId }: { assignmentId: string; movementId: string }) => {
      console.log('Deleting pump over assignment with ID:', assignmentId);

      // 1. Get the movement ID associated with the assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .select('movement_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) {
        console.error('Failed to get movement ID from assignment:', assignmentError);
        throw new Error(`Failed to get movement ID from assignment: ${assignmentError.message}`);
      }

      const movementId = assignmentData?.movement_id;

      // 2. Delete the terminal assignment
      const { error: deleteAssignmentError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteAssignmentError) {
        console.error('Failed to delete terminal assignment:', deleteAssignmentError);
        throw new Error(`Failed to delete terminal assignment: ${deleteAssignmentError.message}`);
      }

      // 3. Delete the movement record
      const { error: deleteMovementError } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId);

      if (deleteMovementError) {
        console.error('Failed to delete movement:', deleteMovementError);
        throw new Error(`Failed to delete movement: ${deleteMovementError.message}`);
      }

      console.log('Successfully deleted pump over assignment and movement with ID:', movementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success('Pump over deleted', {
        description: 'Internal pump over has been deleted successfully.'
      });
    },
    onError: (error) => {
      console.error('Error deleting pump over:', error);
      toast.error('Failed to delete pump over', {
        description: error.message
      });
    }
  });
  
  // Delete storage movement mutation
  const deleteStorageMovementMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      console.log('Deleting storage movement assignment with ID:', assignmentId);

      // 1. Get the movement ID associated with the assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('movement_terminal_assignments')
        .select('movement_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) {
        console.error('Failed to get movement ID from assignment:', assignmentError);
        throw new Error(`Failed to get movement ID from assignment: ${assignmentError.message}`);
      }

      const movementId = assignmentData?.movement_id;

      // 2. Delete the terminal assignment
      const { error: deleteAssignmentError } = await supabase
        .from('movement_terminal_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteAssignmentError) {
        console.error('Failed to delete terminal assignment:', deleteAssignmentError);
        throw new Error(`Failed to delete terminal assignment: ${deleteAssignmentError.message}`);
      }

      // 3. Delete the movement record
      const { error: deleteMovementError } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId);

      if (deleteMovementError) {
        console.error('Failed to delete movement:', deleteMovementError);
        throw new Error(`Failed to delete movement: ${deleteMovementError.message}`);
      }

      console.log('Successfully deleted storage movement assignment and movement with ID:', movementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movementAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success('Movement deleted', {
        description: 'Storage movement has been deleted successfully from this terminal.'
      });
    },
    onError: (error) => {
      console.error('Error deleting storage movement:', error);
      toast.error('Failed to delete storage movement', {
        description: error.message
      });
    }
  });

  const createStockReconciliation = async (quantity: number, comment?: string) => {
    return createStockReconciliationMutation.mutateAsync({ quantity, comment });
  };

  const deleteStockReconciliation = async (assignmentId: string) => {
    return deleteStockReconciliationMutation.mutateAsync(assignmentId);
  };

  const updateAssignmentSortOrder = async (id: string, newSortOrder: number) => {
    await updateAssignmentSortOrderMutation.mutateAsync({ id, newSortOrder });
  };
  
  const updateTankMovement = async (movementId: string, tankId: string, quantity: number) => {
    return updateTankMovementMutation.mutateAsync({ movementId, tankId, quantity });
  };
  
  const updateMovementQuantity = async (id: string, quantity: number) => {
    return updateMovementQuantityMutation.mutateAsync({ id, quantity });
  };
  
  const updateAssignmentComments = async (id: string, comments: string) => {
    return updateAssignmentCommentsMutation.mutateAsync({ id, comments });
  };
  
  const updateTankProduct = async (id: string, product: string) => {
    return updateTankProductMutation.mutateAsync({ id, product });
  };
  
  const updateTankSpec = async (id: string, spec: string) => {
    return updateTankSpecMutation.mutateAsync({ id, spec });
  };
  
  const updateTankHeating = async (id: string, isHeating: string) => {
    return updateTankHeatingMutation.mutateAsync({ id, isHeating });
  };
  
  const updateTankCapacity = async (id: string, capacity: number) => {
    return updateTankCapacityMutation.mutateAsync({ id, capacity });
  };
  
  const updateTankNumber = async (id: string, tankNumber: string) => {
    return updateTankNumberMutation.mutateAsync({ id, tankNumber });
  };
  
  const createPumpOver = async (quantity: number, comment?: string) => {
    return createPumpOverMutation.mutateAsync({ quantity, comment });
  };
  
  const deletePumpOver = async (assignmentId: string, movementId: string) => {
    return deletePumpOverMutation.mutateAsync({ assignmentId, movementId });
  };
  
  const deleteStorageMovement = async (assignmentId: string) => {
    return deleteStorageMovementMutation.mutateAsync(assignmentId);
  };

  return {
    terminalId,
    setTerminalId,
    movementAssignments,
    movements,
    tankMovements,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    isLoading,
    error,
    createStockReconciliation,
    deleteStockReconciliation,
    updateAssignmentSortOrder,
    updateTankMovement,
    updateMovementQuantity,
    updateAssignmentComments,
    updateTankProduct,
    updateTankSpec,
    updateTankHeating,
    updateTankCapacity,
    updateTankNumber,
    createPumpOver,
    deletePumpOver,
    deleteStorageMovement,
  };
};
