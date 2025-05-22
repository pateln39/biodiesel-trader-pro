
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
  const [activeFilterCount, setActiveFilterCount] = React.useState<number>(0);
  
  // Get page from URL or default to 1
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15; // Fixed page size
  
  const paginationParams: PaginationParams = {
    page,
    pageSize
  };

  // Extract filters from URL parameters
  const extractArrayParam = (param: string | null): string[] | undefined => {
    if (!param) return undefined;
    return param.split(',').map(item => item.trim()).filter(Boolean);
  };

  const initialFilters: OpenTradeFilters = {
    trade_reference: searchParams.get('trade_reference') || undefined,
    buy_sell: (searchParams.get('buy_sell') as 'buy' | 'sell') || undefined,
    product: extractArrayParam(searchParams.get('product')),
    counterparty: extractArrayParam(searchParams.get('counterparty')),
    inco_term: extractArrayParam(searchParams.get('inco_term')),
    sustainability: extractArrayParam(searchParams.get('sustainability')),
    credit_status: extractArrayParam(searchParams.get('credit_status')),
    customs_status: extractArrayParam(searchParams.get('customs_status')),
    contract_status: extractArrayParam(searchParams.get('contract_status')),
    pricing_type: searchParams.get('pricing_type') || undefined,
    status: (searchParams.get('status') as 'all' | 'in-process' | 'completed') || 'all'
  };

  const [filters, setFilters] = React.useState<OpenTradeFilters>(initialFilters);
  
  // Count active filters
  React.useEffect(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === 'status' && value === 'all') {
          // Don't count 'all' status as a filter
          return;
        }
        
        if (Array.isArray(value)) {
          // For array values, count each non-empty array as one filter
          if (value.length > 0) {
            count++;
          }
        } else {
          count++;
        }
      }
    });
    setActiveFilterCount(count);
  }, [filters]);
  
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
        if (value !== undefined) {
          if (Array.isArray(value) && value.length > 0) {
            // Join array values with comma for URL parameter
            newParams.set(key, value.join(','));
          } else if (!Array.isArray(value) && value !== '') {
            newParams.set(key, value);
          } else {
            // Remove parameter if it's an empty array or empty string
            newParams.delete(key);
          }
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
    // If page change is triggered with page 1, it might be a filter clear request
    if (newPage === 1 && page === 1 && activeFilterCount > 0) {
      // Clear all filters except status
      const defaultFilters: OpenTradeFilters = { status: 'all' };
      setFilters(defaultFilters);
    }
    // Update URL parameters
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage.toString());
      return newParams;
    });
  };

  const handleClearFilters = () => {
    const defaultFilters: OpenTradeFilters = { status: 'all' };
    setFilters(defaultFilters);
    setSearchParams(new URLSearchParams({ page: '1', status: 'all' }));
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
          <div className="flex space-x-2">
            {activeFilterCount > 0 && (
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear Filters ({activeFilterCount})
              </Button>
            )}
            <Button onClick={handleRefreshTable}>
              Refresh Data
            </Button>
          </div>
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
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {activeFilterCount}
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
          activeFilterCount={activeFilterCount}
        />
      </div>
    </Layout>
  );
};

export default OpenTradesPage;
