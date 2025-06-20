import React, { useState, useEffect } from 'react';
import { Filter, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceData } from '@/hooks/useReferenceData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import OpenTradesTable from '@/components/operations/OpenTradesTable';
import MovementsTable from '@/components/operations/MovementsTable';
import OpenTradesFilter from '@/components/operations/OpenTradesFilter';
import MovementsFilter, { FilterOptions } from '@/components/operations/MovementsFilter';
import { exportMovementsToExcel, exportOpenTradesToExcel } from '@/utils/excelExportUtils';
import { initializeAssignmentSortOrder, fixDuplicateSortOrders } from '@/utils/cleanupUtils';
import { useSortableMovements } from '@/hooks/useSortableMovements';
import { OpenTradeFilters } from '@/hooks/useFilteredOpenTrades';
import { useMovementDateSort } from '@/hooks/useMovementDateSort';
import { useOpenTradeFilterOptions } from '@/hooks/useOpenTradeFilterOptions';

const OperationsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('open-trades');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isOpenTradesFilterOpen, setIsOpenTradesFilterOpen] = useState(false);
  const [isMovementsFilterOpen, setIsMovementsFilterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [openTradeFilters, setOpenTradeFilters] = useState<OpenTradeFilters>({ status: 'all' });
  const [activeOpenTradeFilterCount, setActiveOpenTradeFilterCount] = useState<number>(0);
  
  // Add sort configuration using the hook
  const { sortColumns, handleSort: toggleSortColumn } = useMovementDateSort();
  
  // Use the useSortableMovements hook to get filtered movements and filter-related functions
  const {
    filteredMovements,
    availableFilterOptions,
    filters,
    updateFilters,
    handleReorder
  } = useSortableMovements();
  
  // Use the new hook to get filter options from actual open trades data
  const { 
    data: openTradeFilterOptions,
    isLoading: isLoadingOpenTradeFilterOptions,
    error: openTradeFilterOptionsError
  } = useOpenTradeFilterOptions();
  
  const { 
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions
  } = useReferenceData();

  // Count active filters for open trades
  useEffect(() => {
    let count = 0;
    Object.entries(openTradeFilters).forEach(([key, value]) => {
      if (value && (key !== 'status' || value !== 'all')) {
        count++;
      }
    });
    setActiveOpenTradeFilterCount(count);
  }, [openTradeFilters]);

  // Initialize sort_order for all tables when component mounts
  useEffect(() => {
    const initializeSortOrder = async () => {
      try {
        // Initialize sort_order for open_trades
        const { error: openTradesError } = await supabase.rpc('initialize_sort_order', {
          p_table_name: 'open_trades'
        });
        
        if (openTradesError) {
          console.error('[OPERATIONS] Error initializing open_trades sort_order:', openTradesError);
        }
        
        // Initialize sort_order for movements
        const { error: movementsError } = await supabase.rpc('initialize_sort_order', {
          p_table_name: 'movements'
        });
        
        if (movementsError) {
          console.error('[OPERATIONS] Error initializing movements sort_order:', movementsError);
          toast.error("Error initializing movement order", {
            description: "There was an error setting up movement sorting order"
          });
        } else {
          console.log('[OPERATIONS] Successfully initialized sort_order for all tables');
        }

        // Initialize sort_order for terminal assignments
        await initializeAssignmentSortOrder();
        
        // Fix any duplicate sort orders that might exist
        await fixDuplicateSortOrders();
      } catch (error) {
        console.error('[OPERATIONS] Error initializing sort_order:', error);
      }
    };
    
    initializeSortOrder();
  }, []);

  const handleRefreshTables = () => {
    setRefreshTrigger(prev => prev + 1);
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

  const handleExportOpenTrades = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing export", {
        description: "Gathering open trades data for export..."
      });
      
      const fileName = await exportOpenTradesToExcel();
      
      toast.success("Export complete", {
        description: `Open trades exported to ${fileName}`
      });
    } catch (error) {
      console.error('[OPERATIONS] Export error:', error);
      toast.error("Failed to export", {
        description: "There was an error exporting open trades data"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    updateFilters(newFilters);
  };

  const handleOpenTradeFilterChange = (newFilters: OpenTradeFilters) => {
    setOpenTradeFilters(newFilters);
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
          <Button onClick={handleRefreshTables}>
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="open-trades">Open Trades</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="open-trades" className="space-y-4">
            <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <CardHeader>
                <CardTitle>Open Trades</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>View and manage open trade positions</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportOpenTrades}
                      disabled={isExporting}
                    >
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsOpenTradesFilterOpen(true)}
                      className="relative"
                    >
                      <Filter className="mr-2 h-4 w-4" /> Filter
                      {activeOpenTradeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                          {activeOpenTradeFilterCount}
                        </span>
                      )}
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpenTradesTable 
                  onRefresh={handleRefreshTables} 
                  key={`open-trades-${refreshTrigger}`} 
                  filters={openTradeFilters}
                />
              </CardContent>
            </Card>
            
            <OpenTradesFilter 
              open={isOpenTradesFilterOpen} 
              onOpenChange={setIsOpenTradesFilterOpen}
              filters={openTradeFilters}
              onFiltersChange={handleOpenTradeFilterChange}
              activeFilterCount={activeOpenTradeFilterCount}
              availableOptions={openTradeFilterOptions || {
                product: [],
                counterparty: [],
                incoTerm: [],
                sustainability: [],
                creditStatus: [],
                customsStatus: [],
                contractStatus: [],
              }}
            />
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
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
                    >
                      <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MovementsTable 
                  key={`movements-${refreshTrigger}`}
                  filteredMovements={filteredMovements}
                  onReorder={handleReorder}
                  selectedMovementIds={[]} // Providing an empty array as default
                  onToggleSelect={() => {}} // Empty function as default
                  onUngroupMovement={() => {}} // Empty function as default
                  isUngrouping={false} // Default to false
                  sortColumns={sortColumns} // Add the missing sortColumns prop
                  onToggleSortColumn={toggleSortColumn} // Add the missing onToggleSortColumn prop
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OperationsPage;
