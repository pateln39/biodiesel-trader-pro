
import React from 'react';
import { Filter, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceData } from '@/hooks/useReferenceData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

import OpenTradesTable from '@/components/operations/OpenTradesTable';
import OpenTradesFilter from '@/components/operations/OpenTradesFilter';
import { exportOpenTradesToExcel } from '@/utils/excelExportUtils';
import { PaginationParams } from '@/types/pagination';
import { OpenTradeFilters } from '@/hooks/useFilteredOpenTrades';

const OpenTradesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);
  const [isOpenTradesFilterOpen, setIsOpenTradesFilterOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Get page from URL or default to 1
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15; // Fixed page size
  
  const paginationParams: PaginationParams = {
    page,
    pageSize
  };

  // Extract filters from URL parameters
  const initialFilters: OpenTradeFilters = {
    trade_reference: searchParams.get('trade_reference') || undefined,
    buy_sell: (searchParams.get('buy_sell') as 'buy' | 'sell') || undefined,
    product: searchParams.get('product') || undefined,
    counterparty: searchParams.get('counterparty') || undefined,
    inco_term: searchParams.get('inco_term') || undefined,
    sustainability: searchParams.get('sustainability') || undefined,
    credit_status: searchParams.get('credit_status') || undefined,
    customs_status: searchParams.get('customs_status') || undefined,
    contract_status: searchParams.get('contract_status') || undefined,
    pricing_type: searchParams.get('pricing_type') || undefined,
    status: (searchParams.get('status') as 'all' | 'in-process' | 'completed') || 'all'
  };

  const [filters, setFilters] = React.useState<OpenTradeFilters>(initialFilters);
  
  const { 
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions
  } = useReferenceData();

  // Initialize sort_order when component mounts
  React.useEffect(() => {
    const initializeSortOrder = async () => {
      try {
        const { error: openTradesError } = await supabase.rpc('initialize_sort_order', {
          p_table_name: 'open_trades'
        });
        
        if (openTradesError) {
          console.error('[OPERATIONS] Error initializing open_trades sort_order:', openTradesError);
        } else {
          console.log('[OPERATIONS] Successfully initialized sort_order for open_trades table');
        }
      } catch (error) {
        console.error('[OPERATIONS] Error initializing sort_order:', error);
      }
    };
    
    initializeSortOrder();
  }, []);

  // Update URL when filters change
  React.useEffect(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      // Update or remove filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      
      return newParams;
    });
  }, [filters, setSearchParams]);

  const handleRefreshTable = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePageChange = (newPage: number) => {
    // Update URL parameters
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage.toString());
      return newParams;
    });
  };

  const handleFiltersChange = (newFilters: OpenTradeFilters) => {
    // When filters change, reset to page 1
    setFilters(newFilters);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', '1');
      return newParams;
    });
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
      toast.error("Export failed", {
        description: "There was an error exporting open trades data"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Open Trades</h1>
          <Button onClick={handleRefreshTable}>
            Refresh Data
          </Button>
        </div>
        
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
                  {filters.activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {filters.activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OpenTradesTable 
              onRefresh={handleRefreshTable} 
              key={`open-trades-${refreshTrigger}-${page}`} 
              filters={filters}
              paginationParams={paginationParams}
              onPageChange={handlePageChange}
            />
          </CardContent>
        </Card>
        
        <OpenTradesFilter 
          open={isOpenTradesFilterOpen} 
          onOpenChange={setIsOpenTradesFilterOpen}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          activeFilterCount={filters.activeFilterCount}
        />
      </div>
    </Layout>
  );
};

export default OpenTradesPage;
