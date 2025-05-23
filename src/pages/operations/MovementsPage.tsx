import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import MovementsTable from '@/components/operations/MovementsTable';
import MovementsFilter, { FilterOptions } from '@/components/operations/MovementsFilter';
import { exportMovementsToExcel } from '@/utils/excelExportUtils';
import MovementsHeader from '@/components/operations/movements/MovementsHeader';
import MovementsActions from '@/components/operations/movements/MovementsActions';
import { PaginationParams } from '@/types/pagination';
import { useMovementDateSort } from '@/hooks/useMovementDateSort';
import { useFilteredMovements } from '@/hooks/useFilteredMovements';
import { useMovementFilterOptions } from '@/hooks/useMovementFilterOptions';
import { Movement } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const MovementsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);
  const [isMovementsFilterOpen, setIsMovementsFilterOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [selectedMovementIds, setSelectedMovementIds] = React.useState<string[]>([]);
  const [isGrouping, setIsGrouping] = React.useState(false);
  const [isUngrouping, setIsUngrouping] = React.useState(false);
  
  // Get page from URL or default to 1
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15; // Fixed page size
  
  // Initialize sorting from URL parameters
  const initialSortParam = searchParams.get('sort') || '';
  const initialSortConfigs = initialSortParam
    ? initialSortParam.split(',').map(sortItem => {
        const [column, direction] = sortItem.split(':');
        return {
          column: column as any,
          direction: (direction || 'asc') as 'asc' | 'desc'
        };
      })
    : [];
  
  const { sortColumns, handleSort: toggleSortColumn, getSortParam } = useMovementDateSort(initialSortConfigs);
  
  const paginationParams: PaginationParams = {
    page,
    pageSize
  };
  
  // Extract filters from URL parameters
  const extractArrayParam = (param: string | null): string[] => {
    if (!param) return [];
    return param.split(',').map(item => item.trim()).filter(Boolean);
  };
  
  const initialFilters: FilterOptions = {
    status: extractArrayParam(searchParams.get('status')),
    product: extractArrayParam(searchParams.get('product')),
    buySell: extractArrayParam(searchParams.get('buySell')),
    incoTerm: extractArrayParam(searchParams.get('incoTerm')),
    sustainability: extractArrayParam(searchParams.get('sustainability')),
    counterparty: extractArrayParam(searchParams.get('counterparty')),
    creditStatus: extractArrayParam(searchParams.get('creditStatus')),
    customsStatus: extractArrayParam(searchParams.get('customsStatus')),
    loadport: extractArrayParam(searchParams.get('loadport')),
    loadportInspector: extractArrayParam(searchParams.get('loadportInspector')),
    disport: extractArrayParam(searchParams.get('disport')),
    disportInspector: extractArrayParam(searchParams.get('disportInspector')),
  };
  
  const [filters, setFilters] = React.useState<FilterOptions>(initialFilters);
  
  // Use the new hook to get all filter options, independent of pagination
  const { 
    data: filterOptions,
    isLoading: isLoadingFilterOptions,
    error: filterOptionsError
  } = useMovementFilterOptions();
  
  // Use the server-side filtering hook
  const { 
    movements: filteredMovements,
    pagination,
    loading,
    refetchMovements,
    activeFilterCount
  } = useFilteredMovements(filters, paginationParams, sortColumns);

  // Update URL when filters or sort parameters change
  React.useEffect(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      // Update or remove filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          newParams.set(key, value.join(','));
        } else {
          newParams.delete(key);
        }
      });
      
      // Add sort parameters
      const sortParam = getSortParam();
      if (sortParam) {
        newParams.set('sort', sortParam);
      } else {
        newParams.delete('sort');
      }
      
      return newParams;
    });
  }, [filters, getSortParam, setSearchParams]);
  
  React.useEffect(() => {
    const initializeSortOrder = async () => {
      try {
        // This will now exclude pump overs (product='Transfer') thanks to our updated function
        const { error: movementsError } = await supabase.rpc('initialize_sort_order', {
          p_table_name: 'movements'
        });
        
        if (movementsError) {
          console.error('[OPERATIONS] Error initializing movements sort_order:', movementsError);
          toast.error("Error initializing movement order", {
            description: "There was an error setting up movement sorting order"
          });
        } else {
          console.log('[OPERATIONS] Successfully initialized sort_order for movements table');
        }
      } catch (error) {
        console.error('[OPERATIONS] Error initializing sort_order:', error);
      }
    };
    
    initializeSortOrder();
  }, []);

  // Group selected movements mutation
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
      queryClient.invalidateQueries({ queryKey: ['filteredMovements'] });
      setIsGrouping(false);
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error in groupMovementsMutation:', error);
      setIsGrouping(false);
    }
  });
  
  // Ungroup movements mutation
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
      queryClient.invalidateQueries({ queryKey: ['filteredMovements'] });
      setIsUngrouping(false);
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error in ungroupMovementsMutation:', error);
      setIsUngrouping(false);
    }
  });

  // Reorder movements mutation
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
      queryClient.invalidateQueries({ queryKey: ['filteredMovements'] });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error in updateSortOrderMutation:', error);
    }
  });

  const handleRefreshTable = () => {
    setRefreshTrigger(prev => prev + 1);
    refetchMovements();
    // Also refresh filter options when table is refreshed
    queryClient.invalidateQueries({ queryKey: ['movementFilterOptions'] });
  };

  const handleExportMovements = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing export", {
        description: "Gathering movements data for export..."
      });
      
      const fileName = await exportMovementsToExcel();
      
      toast.success("Export complete", {
        description: `Movements exported to ${fileName}`
      });
    } catch (error) {
      console.error('[OPERATIONS] Export error:', error);
      toast.error("Export failed", {
        description: "There was an error exporting movements data"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', '1');
      return newParams;
    });
  };

  const handlePageChange = (newPage: number) => {
    // Update URL parameters
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage.toString());
      return newParams;
    });
  };

  const handleReorder = async (reorderedItems: Movement[]) => {
    console.log('[MOVEMENTS] Starting reordering process for', reorderedItems.length, 'items');

    // Calculate base sort_order for the current page
    const pageOffset = page > 1 ? (page - 1) * pageSize : 0;

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
      refetchMovements();
    }
  };

  const toggleMovementSelection = (id: string) => {
    setSelectedMovementIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const selectAllMovements = () => {
    setSelectedMovementIds(filteredMovements.map(m => m.id));
  };
  
  const clearSelection = () => {
    setSelectedMovementIds([]);
  };
  
  const groupSelectedMovements = () => {
    if (selectedMovementIds.length >= 2) {
      setIsGrouping(true);
      groupMovementsMutation.mutate(selectedMovementIds);
    }
  };
  
  const ungroupMovement = (groupId: string) => {
    if (groupId) {
      setIsUngrouping(true);
      ungroupMovementsMutation.mutate(groupId);
    }
  };

  // Get available filter options from the movements
  const availableFilterOptions = React.useMemo(() => {
    if (!filteredMovements.length) return {
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
    
    return {
      status: [...new Set(filteredMovements.map(m => m.status))].filter(Boolean).sort(),
      product: [...new Set(filteredMovements.map(m => m.product))].filter(Boolean).sort(),
      buySell: [...new Set(filteredMovements.map(m => m.buySell))].filter(Boolean).sort(),
      incoTerm: [...new Set(filteredMovements.map(m => m.incoTerm))].filter(Boolean).sort(),
      sustainability: [...new Set(filteredMovements.map(m => m.sustainability))].filter(Boolean).sort(),
      counterparty: [...new Set(filteredMovements.map(m => m.counterpartyName))].filter(Boolean).sort(),
      creditStatus: [...new Set(filteredMovements.map(m => m.creditStatus))].filter(Boolean).sort(),
      customsStatus: [...new Set(filteredMovements.map(m => m.customsStatus))].filter(Boolean).sort(),
      loadport: [...new Set(filteredMovements.map(m => m.loadport))].filter(Boolean).sort(),
      loadportInspector: [...new Set(filteredMovements.map(m => m.loadportInspector))].filter(Boolean).sort(),
      disport: [...new Set(filteredMovements.map(m => m.disport))].filter(Boolean).sort(),
      disportInspector: [...new Set(filteredMovements.map(m => m.disportInspector))].filter(Boolean).sort(),
    };
  }, [filteredMovements]);

  return (
    <Layout>
      <div className="space-y-6">
        <MovementsHeader onRefresh={handleRefreshTable} />
        
        <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
          <CardHeader>
            <CardTitle>Movements</CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>View and manage product movements</span>
              <MovementsActions 
                isExporting={isExporting}
                selectedMovementIds={selectedMovementIds}
                onExport={handleExportMovements}
                onOpenFilter={() => setIsMovementsFilterOpen(true)}
                onSelectAll={selectAllMovements}
                onClearSelection={clearSelection}
                onGroupSelected={groupSelectedMovements}
                isGrouping={isGrouping}
                activeFilterCount={activeFilterCount}
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MovementsTable 
              key={`movements-${refreshTrigger}-${page}-${getSortParam()}`}
              filteredMovements={filteredMovements}
              selectedMovementIds={selectedMovementIds}
              onToggleSelect={toggleMovementSelection}
              onReorder={handleReorder}
              onUngroupMovement={ungroupMovement}
              isUngrouping={isUngrouping}
              pagination={pagination}
              onPageChange={handlePageChange}
              sortColumns={sortColumns}
              onToggleSortColumn={toggleSortColumn}
            />
          </CardContent>
        </Card>
        
        <MovementsFilter 
          open={isMovementsFilterOpen} 
          onOpenChange={setIsMovementsFilterOpen}
          filterOptions={filters}
          availableOptions={filterOptions || {
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
          }}
          onFilterChange={handleFilterChange}
        />
      </div>
    </Layout>
  );
};

export default MovementsPage;
