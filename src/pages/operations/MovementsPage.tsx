
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import MovementsTable from '@/components/operations/MovementsTable';
import MovementsFilter, { FilterOptions } from '@/components/operations/MovementsFilter';
import { exportMovementsToExcel } from '@/utils/excelExportUtils';
import { useSortableMovements } from '@/hooks/useSortableMovements';
import MovementsHeader from '@/components/operations/movements/MovementsHeader';
import MovementsActions from '@/components/operations/movements/MovementsActions';
import { PaginationParams } from '@/types/pagination';

const MovementsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);
  const [isMovementsFilterOpen, setIsMovementsFilterOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Get page from URL or default to 1
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15; // Fixed page size
  
  const paginationParams: PaginationParams = {
    page,
    pageSize
  };
  
  const { 
    filteredMovements,
    availableFilterOptions,
    filters,
    updateFilters,
    refetch,
    handleReorder,
    selectedMovementIds,
    toggleMovementSelection,
    selectAllMovements,
    clearSelection,
    groupSelectedMovements,
    ungroupMovement,
    isGrouping,
    isUngrouping,
    pagination
  } = useSortableMovements(undefined, paginationParams);

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

  const handleRefreshTable = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
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
    updateFilters(newFilters);
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

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, filterValues) => 
      count + filterValues.length, 0);
  };

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
                activeFilterCount={getActiveFilterCount()}
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MovementsTable 
              key={`movements-${refreshTrigger}-${page}`}
              filteredMovements={filteredMovements}
              selectedMovementIds={selectedMovementIds}
              onToggleSelect={toggleMovementSelection}
              onReorder={handleReorder}
              onUngroupMovement={ungroupMovement}
              isUngrouping={isUngrouping}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </CardContent>
        </Card>
        
        <MovementsFilter 
          open={isMovementsFilterOpen} 
          onOpenChange={setIsMovementsFilterOpen}
          filterOptions={filters}
          availableOptions={availableFilterOptions}
          onFilterChange={handleFilterChange}
        />
      </div>
    </Layout>
  );
};

export default MovementsPage;
