
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';

// Function to fetch all movements with ordering by sort_order
const fetchMovements = async (): Promise<Movement[]> => {
  try {
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    // Transform the data to match the Movement type
    return (movements || []).map((m: any) => ({
      id: m.id,
      referenceNumber: m.reference_number,
      tradeLegId: m.trade_leg_id,
      parentTradeId: m.parent_trade_id,
      tradeReference: m.trade_reference,
      counterpartyName: m.counterparty || 'Unknown',
      product: m.product || 'Unknown',
      buySell: m.buy_sell,
      incoTerm: m.inco_term,
      sustainability: m.sustainability,
      scheduledQuantity: m.scheduled_quantity,
      blQuantity: m.bl_quantity,
      actualQuantity: m.actual_quantity,
      nominationEta: m.nomination_eta ? new Date(m.nomination_eta) : undefined,
      nominationValid: m.nomination_valid ? new Date(m.nomination_valid) : undefined,
      cashFlow: m.cash_flow ? new Date(m.cash_flow) : undefined,
      bargeName: m.barge_name,
      loadport: m.loadport,
      loadportInspector: m.loadport_inspector,
      disport: m.disport,
      disportInspector: m.disport_inspector,
      blDate: m.bl_date ? new Date(m.bl_date) : undefined,
      codDate: m.cod_date ? new Date(m.cod_date) : undefined,
      pricingType: m.pricing_type,
      pricingFormula: m.pricing_formula,
      comments: m.comments,
      customsStatus: m.customs_status,
      creditStatus: m.credit_status,
      contractStatus: m.contract_status,
      status: m.status || 'scheduled',
      date: new Date(m.created_at),
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
      sort_order: m.sort_order,
      // Add any other fields needed
    }));
  } catch (error: any) {
    console.error('[MOVEMENTS] Error fetching movements:', error);
    throw new Error(error.message);
  }
};

export const useSortableMovements = (filterStatuses: string[] = []) => {
  const queryClient = useQueryClient();
  const [localMovements, setLocalMovements] = useState<Movement[]>([]);
  
  // Query to get the movements
  const { data: movements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
    refetchOnWindowFocus: false,
  });

  // Update local state when movements change from the API
  useEffect(() => {
    if (movements?.length) {
      setLocalMovements(movements);
    }
  }, [movements]);

  // Filter movements based on filterStatuses
  const filteredMovements = useMemo(() => {
    if (filterStatuses.length === 0) {
      return localMovements;
    }
    
    return localMovements.filter(movement => 
      filterStatuses.includes(movement.status)
    );
  }, [localMovements, filterStatuses]);

  // Mutation to update the sort order in the database
  const updateSortOrderMutation = useMutation({
    mutationFn: async ({
      id,
      newSortOrder,
    }: {
      id: string;
      newSortOrder: number;
    }) => {
      // Call the update_sort_order database function
      const { data, error } = await supabase.rpc('update_sort_order', {
        p_table_name: 'movements',
        p_id: id,
        p_new_sort_order: newSortOrder,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
  });

  // Function to handle reordering
  const handleReorder = useCallback(
    async (reorderedItems: Movement[]) => {
      // Update local state immediately for a responsive UI
      setLocalMovements(reorderedItems);

      // Get the moved item and its new index
      const updatedItems = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }));

      // Update each item's sort order in the database
      try {
        // Use Promise.all to execute all updates in parallel
        await Promise.all(
          updatedItems.map(item => 
            updateSortOrderMutation.mutate({
              id: item.id,
              newSortOrder: item.sort_order,
            })
          )
        );
      } catch (error) {
        console.error('Error updating sort order:', error);
        // Revert to the original order
        refetch();
      }
    },
    [updateSortOrderMutation, refetch]
  );

  return {
    movements: localMovements,
    filteredMovements,
    isLoading,
    error,
    refetch,
    handleReorder,
  };
};
