
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
import MovementsFilter from '@/components/operations/MovementsFilter';
import { exportOpenTradesToExcel, exportMovementsToExcel } from '@/utils/excelExportUtils';
import { useOpenTrades } from '@/hooks/useOpenTrades';
import { useSortableMovements } from '@/hooks/useSortableMovements';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const OperationsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('open-trades');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [openTradesFilterStatus, setOpenTradesFilterStatus] = useState<'all' | 'in-process' | 'completed'>('all');
  const [movementsFilterStatus, setMovementsFilterStatus] = useState<string[]>([]);
  const [isOpenTradesFilterOpen, setIsOpenTradesFilterOpen] = useState(false);
  const [isMovementsFilterOpen, setIsMovementsFilterOpen] = useState(false);
  
  // Get data for export functionality
  const { openTrades } = useOpenTrades();
  const { movements } = useSortableMovements();

  const { 
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions
  } = useReferenceData();

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
      } catch (error) {
        console.error('[OPERATIONS] Error initializing sort_order:', error);
      }
    };
    
    initializeSortOrder();
  }, []);

  const handleRefreshTables = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExportOpenTrades = () => {
    try {
      exportOpenTradesToExcel(openTrades);
      toast.success("Export successful", {
        description: "Open trades have been exported to Excel"
      });
    } catch (error) {
      console.error("Error exporting open trades:", error);
      toast.error("Export failed", {
        description: "There was an error exporting open trades"
      });
    }
  };

  const handleExportMovements = () => {
    try {
      exportMovementsToExcel(movements);
      toast.success("Export successful", {
        description: "Movements have been exported to Excel"
      });
    } catch (error) {
      console.error("Error exporting movements:", error);
      toast.error("Export failed", {
        description: "There was an error exporting movements"
      });
    }
  };

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
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleExportOpenTrades}
                          >
                            <Download className="mr-2 h-4 w-4" /> Export
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export to Excel</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsOpenTradesFilterOpen(true)}
                    >
                      <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpenTradesTable 
                  onRefresh={handleRefreshTables} 
                  key={`open-trades-${refreshTrigger}`} 
                  filterStatus={openTradesFilterStatus}
                />
              </CardContent>
            </Card>
            
            <OpenTradesFilter 
              open={isOpenTradesFilterOpen} 
              onOpenChange={setIsOpenTradesFilterOpen}
              selectedStatus={openTradesFilterStatus}
              onStatusChange={setOpenTradesFilterStatus}
            />
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <CardHeader>
                <CardTitle>Movements</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>View and manage product movements</span>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleExportMovements}
                          >
                            <Download className="mr-2 h-4 w-4" /> Export
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export to Excel</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

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
                  filterStatuses={movementsFilterStatus}
                />
              </CardContent>
            </Card>
            
            <MovementsFilter 
              open={isMovementsFilterOpen} 
              onOpenChange={setIsMovementsFilterOpen}
              selectedStatuses={movementsFilterStatus}
              onStatusesChange={setMovementsFilterStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OperationsPage;
