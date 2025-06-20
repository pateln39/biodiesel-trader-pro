import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { FilterOptions } from '@/components/operations/MovementsFilter';
import { PaginationParams, PaginationMeta } from '@/types/pagination';

const fetchMovements = async (paginationParams?: PaginationParams): Promise<{ movements: Movement[], pagination: PaginationMeta }> => {
  try {
    console.log('[MOVEMENTS] Fetching movements with pagination', paginationParams);
    
    // First, get the total count of records
    const { count: totalCount, error: countError } = await supabase
      .from('movements')
      .select('*', { count: 'exact', head: true })
      .filter('product', 'neq', 'Transfer')
      .filter('product', 'neq', 'RECONCILIATION');
    
    if (countError) {
      console.error('[MOVEMENTS] Error counting movements:', countError.message);
      throw countError;
    }
    
    // Calculate pagination metadata
    const page = paginationParams?.page || 1;
    const pageSize = paginationParams?.pageSize || 15;
    const totalItems = totalCount || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    console.log(`[MOVEMENTS] Fetching page ${page}, items ${from}-${to} of ${totalItems} total items`);
    
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .filter('product', 'neq', 'Transfer')
      .filter('product', 'neq', 'RECONCILIATION')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[MOVEMENTS] Error fetching movements:', error);
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    console.log(`[MOVEMENTS] Successfully fetched ${movements?.length || 0} movements for page ${page}`);
    
    // Transform the data to match the Movement type
    const transformedMovements = (movements || []).map((m: any) => ({
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
      loading_period_start: m.loading_period_start,
      loading_period_end: m.loading_period_end,
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
      group_id: m.group_id,
    }));

    return { 
      movements: transformedMovements, 
      pagination: {
        totalItems,
        totalPages: totalPages > 0 ? totalPages : 1,
        currentPage: page,
        pageSize
      } 
    };
  } catch (error: any) {
    console.error('[MOVEMENTS] Error fetching movements:', error);
    throw new Error(error.message);
  }
};

const initializeMovementSortOrder = async (): Promise<void> => {
  try {
    console.log('[MOVEMENTS] Initializing sort_order for all null values');
    const { data, error } = await supabase.rpc('initialize_sort_order', {
      p_table_name: 'movements'
    });
    
    if (error) {
      console.error('[MOVEMENTS] Error initializing sort_order:', error);
      throw error;
    }
    
    console.log('[MOVEMENTS] Successfully initialized sort_order values');
    return data;
  } catch (error) {
    console.error('[MOVEMENTS] Error in initializeMovementSortOrder:', error);
    throw error;
  }
};

const extractAvailableFilterOptions = (movements: Movement[]) => {
  const options = {
    status: [...new Set(movements.map(m => m.status))].filter(Boolean).sort(),
    product: [...new Set(movements.map(m => m.product))].filter(Boolean).sort(),
    buySell: [...new Set(movements.map(m => m.buySell))].filter(Boolean).sort(),
    incoTerm: [...new Set(movements.map(m => m.incoTerm))].filter(Boolean).sort(),
    sustainability: [...new Set(movements.map(m => m.sustainability))].filter(Boolean).sort(),
    counterparty: [...new Set(movements.map(m => m.counterpartyName))].filter(Boolean).sort(),
    creditStatus: [...new Set(movements.map(m => m.creditStatus))].filter(Boolean).sort(),
    customsStatus: [...new Set(movements.map(m => m.customsStatus))].filter(Boolean).sort(),
    loadport: [...new Set(movements.map(m => m.loadport))].filter(Boolean).sort(),
    loadportInspector: [...new Set(movements.map(m => m.loadportInspector))].filter(Boolean).sort(),
    disport: [...new Set(movements.map(m => m.disport))].filter(Boolean).sort(),
    disportInspector: [...new Set(movements.map(m => m.disportInspector))].filter(Boolean).sort(),
  };
  
  return options;
};

export const useSortableMovements = (
  filterOptions?: Partial<FilterOptions>,
  paginationParams?: PaginationParams
) => {
  const queryClient = useQueryClient();
  const [localMovements, setLocalMovements] = useState<Movement[]>([]);
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);

  const emptyFilters: FilterOptions = {
    status: [],
    product: [],
    buySell: [],
    incoTerm: [],
    sustainability: [],
    counterparty: [],
    creditStatus: [],
    customsStatus: [],
    loadport: [],
    loadportInspector: [],
    disport: [],
    disportInspector: [],
  };
  
  const [filters, setFilters] = useState<FilterOptions>(
    filterOptions ? { ...emptyFilters, ...filterOptions } : emptyFilters
  );
  
  const initSortOrderMutation = useMutation({
    mutationFn: initializeMovementSortOrder,
    onSuccess: () => {
      console.log('[MOVEMENTS] Sort order initialization successful - refetching data');
      refetch();
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error in initSortOrderMutation:', error);
    }
  });
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['movements', paginationParams],
    queryFn: () => fetchMovements(paginationParams),
    refetchOnWindowFocus: false,
  });

  const movements = data?.movements || [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (movements?.length) {
      const hasNullSortOrder = movements.some(m => m.sort_order === null || m.sort_order === undefined);
      if (hasNullSortOrder) {
        console.log('[MOVEMENTS] Detected null sort_order values, initializing...');
        initSortOrderMutation.mutate();
      }
    }
  }, [movements, initSortOrderMutation]);

  useEffect(() => {
    if (movements?.length) {
      console.log('[MOVEMENTS] Updating local movements state with', movements.length, 'items');
      console.log('[MOVEMENTS] First few sort_order values:', 
        movements.slice(0, 5).map(m => m.sort_order).join(', '));
      setLocalMovements(movements);
    }
  }, [movements]);

  const availableFilterOptions = useMemo(
    () => extractAvailableFilterOptions(movements),
    [movements]
  );

  useEffect(() => {
    if (filterOptions) {
      setFilters(prev => ({ ...prev, ...filterOptions }));
    }
  }, [filterOptions]);

  const filteredMovements = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some(f => 
      Array.isArray(f) ? f.length > 0 : (typeof f === 'string' && f !== '')
    );
    
    if (!hasActiveFilters) {
      return localMovements;
    }
    
    return localMovements.filter(movement => {
      // Handle array filters
      if (Array.isArray(filters.status) && filters.status.length > 0 && !filters.status.includes(movement.status)) {
        return false;
      }
      
      if (Array.isArray(filters.product) && filters.product.length > 0 && !filters.product.includes(movement.product)) {
        return false;
      }
      
      if (Array.isArray(filters.buySell) && filters.buySell.length > 0 && !filters.buySell.includes(movement.buySell)) {
        return false;
      }
      
      if (Array.isArray(filters.incoTerm) && filters.incoTerm.length > 0 && !filters.incoTerm.includes(movement.incoTerm)) {
        return false;
      }
      
      if (Array.isArray(filters.sustainability) && filters.sustainability.length > 0 && 
          (!movement.sustainability || !filters.sustainability.includes(movement.sustainability))) {
        return false;
      }
      
      if (Array.isArray(filters.counterparty) && filters.counterparty.length > 0 && !filters.counterparty.includes(movement.counterpartyName)) {
        return false;
      }
      
      if (Array.isArray(filters.creditStatus) && filters.creditStatus.length > 0 && 
          (!movement.creditStatus || !filters.creditStatus.includes(movement.creditStatus))) {
        return false;
      }
      
      if (Array.isArray(filters.customsStatus) && filters.customsStatus.length > 0 && 
          (!movement.customsStatus || !filters.customsStatus.includes(movement.customsStatus))) {
        return false;
      }
      
      if (Array.isArray(filters.loadport) && filters.loadport.length > 0 && 
          (!movement.loadport || !filters.loadport.includes(movement.loadport))) {
        return false;
      }
      
      if (Array.isArray(filters.loadportInspector) && filters.loadportInspector.length > 0 && 
          (!movement.loadportInspector || !filters.loadportInspector.includes(movement.loadportInspector))) {
        return false;
      }
      
      if (Array.isArray(filters.disport) && filters.disport.length > 0 && 
          (!movement.disport || !filters.disport.includes(movement.disport))) {
        return false;
      }
      
      if (Array.isArray(filters.disportInspector) && filters.disportInspector.length > 0 && 
          (!movement.disportInspector || !filters.disportInspector.includes(movement.disportInspector))) {
        return false;
      }
      
      return true;
    });
  }, [localMovements, filters]);

  const updateSortOrderMutation = useMutation({
    mutationFn: async ({
      id,
      newSortOrder,
    }: {
      id: string;
      newSortOrder: number;
    }) => {
      console.log(`[MOVEMENTS] Updating sort_order for item ${id} to ${newSortOrder}`);
      
      const { data, error } = await supabase.rpc('update_sort_order', {
        p_table_name: 'movements',
        p_id: id,
        p_new_sort_order: newSortOrder,
      });

      if (error) {
        console.error('[MOVEMENTS] Error updating sort_order:', error);
        throw error;
      }
      
      console.log(`[MOVEMENTS] Successfully updated sort_order for item ${id}`);
      return data;
    },
    onSuccess: () => {
      console.log('[MOVEMENTS] Sort order update successful - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error in updateSortOrderMutation:', error);
    }
  });

  const groupMovementsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length < 2) {
        throw new Error('At least 2 movements are required to create a group');
      }

      // Generate a new group ID
      const groupId = crypto.randomUUID();
      
      console.log(`[MOVEMENTS] Creating movement group ${groupId} with ${ids.length} items`);
      
      // Update all selected movements with the new group ID
      const { error } = await supabase
        .from('movements')
        .update({ group_id: groupId })
        .in('id', ids);
        
      if (error) {
        console.error('[MOVEMENTS] Error creating movement group:', error);
        throw error;
      }
      
      console.log(`[MOVEMENTS] Successfully created movement group ${groupId}`);
      return groupId;
    },
    onSuccess: () => {
      console.log('[MOVEMENTS] Group creation successful - invalidating queries');
      setSelectedMovementIds([]);
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error in groupMovementsMutation:', error);
    }
  });
  
  const ungroupMovementsMutation = useMutation({
    mutationFn: async (groupId: string) => {
      console.log(`[MOVEMENTS] Removing movements from group ${groupId}`);
      
      // Update all movements in the group to have null group_id
      const { error } = await supabase
        .from('movements')
        .update({ group_id: null })
        .eq('group_id', groupId);
        
      if (error) {
        console.error('[MOVEMENTS] Error removing movements from group:', error);
        throw error;
      }
      
      console.log(`[MOVEMENTS] Successfully removed movements from group ${groupId}`);
      return groupId;
    },
    onSuccess: () => {
      console.log('[MOVEMENTS] Group removal successful - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error in ungroupMovementsMutation:', error);
    }
  });

  const handleReorder = useCallback(
    async (reorderedItems: Movement[]) => {
      console.log('[MOVEMENTS] Starting reordering process for', reorderedItems.length, 'items');
      
      // Update local state immediately for a responsive UI
      setLocalMovements(reorderedItems);

      // Calculate base sort_order for the current page
      const pageOffset = paginationParams && paginationParams.page > 1 
        ? (paginationParams.page - 1) * (paginationParams.pageSize || 15) 
        : 0;

      // Update sort_order for all reordered items with page offset
      const updatedItems = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: pageOffset + index + 1,
      }));

      console.log('[MOVEMENTS] Prepared sort_order updates with page offset', pageOffset, ':', 
        updatedItems.slice(0, 3).map(i => `${i.id.slice(-4)}: ${i.sort_order}`).join(', '), '...');

      try {
        await Promise.all(
          updatedItems.map(item => 
            updateSortOrderMutation.mutate({
              id: item.id,
              newSortOrder: item.sort_order,
            })
          )
        );
        console.log('[MOVEMENTS] All sort_order updates completed successfully');
      } catch (error) {
        console.error('[MOVEMENTS] Error updating sort order:', error);
        console.log('[MOVEMENTS] Reverting to original order');
        refetch();
      }
    },
    [updateSortOrderMutation, refetch, paginationParams]
  );

  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const toggleMovementSelection = useCallback((id: string) => {
    setSelectedMovementIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  const selectAllMovements = useCallback(() => {
    setSelectedMovementIds(filteredMovements.map(m => m.id));
  }, [filteredMovements]);
  
  const clearSelection = useCallback(() => {
    setSelectedMovementIds([]);
  }, []);
  
  const groupSelectedMovements = useCallback(() => {
    if (selectedMovementIds.length >= 2) {
      groupMovementsMutation.mutate(selectedMovementIds);
    }
  }, [selectedMovementIds, groupMovementsMutation]);
  
  const ungroupMovement = useCallback((groupId: string) => {
    if (groupId) {
      ungroupMovementsMutation.mutate(groupId);
    }
  }, [ungroupMovementsMutation]);

  return {
    movements: localMovements,
    filteredMovements,
    availableFilterOptions,
    filters,
    updateFilters,
    isLoading,
    error,
    refetch,
    handleReorder,
    selectedMovementIds,
    toggleMovementSelection,
    selectAllMovements,
    clearSelection,
    groupSelectedMovements,
    ungroupMovement,
    isGrouping: groupMovementsMutation.isPending,
    isUngrouping: ungroupMovementsMutation.isPending,
    pagination
  };
};
