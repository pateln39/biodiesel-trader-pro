import React from 'react';
import { Filter, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceData } from '@/hooks/useReferenceData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import MovementsTable from '@/components/operations/MovementsTable';
import MovementsFilter, { FilterOptions } from '@/components/operations/MovementsFilter';
import { exportMovementsToExcel } from '@/utils/excelExportUtils';
import { useSortableMovements } from '@/hooks/useSortableMovements';

const MovementsPage = () => {
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);
  const [isMovementsFilterOpen, setIsMovementsFilterOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  const { 
    filteredMovements,
    availableFilterOptions,
    filters,
    updateFilters,
    refetch,
    handleReorder
  } = useSortableMovements();

  React.useEffect(() => {
    const initializeSortOrder = async () => {
      try {
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
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, filterValues) => 
      count + filterValues.length, 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Movements</h1>
          <Button onClick={handleRefreshTable}>
            Refresh Data
          </Button>
        </div>
        
        <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
          <CardHeader>
            <CardTitle>Movements</CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>View and manage product movements</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportMovements}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsMovementsFilterOpen(true)}
                  className="relative"
                >
                  <Filter className="mr-2 h-4 w-4" /> 
                  Filter
                  {getActiveFilterCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </Button>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MovementsTable 
              key={`movements-${refreshTrigger}`}
              filteredMovements={filteredMovements}
              onReorder={handleReorder}
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
