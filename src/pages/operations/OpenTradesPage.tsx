
import React from 'react';
import { Filter, Download, X } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceData } from '@/hooks/useReferenceData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

import OpenTradesTable from '@/components/operations/OpenTradesTable';
import OpenTradesFilter, { OpenTradesFilters } from '@/components/operations/OpenTradesFilter';
import { exportOpenTradesToExcel } from '@/utils/excelExportUtils';
import { PaginationParams } from '@/types/pagination';

const OpenTradesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);
  const [isOpenTradesFilterOpen, setIsOpenTradesFilterOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Initialize filters state
  const [filters, setFilters] = React.useState<OpenTradesFilters>({
    status: 'all',
    buySell: 'all'
  });
  
  // Get page from URL or default to 1
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15; // Fixed page size
  
  const paginationParams: PaginationParams = {
    page,
    pageSize
  };
  
  const { 
    counterparties,
    sustainabilityOptions,
    productOptions,
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

  const handleFiltersChange = (newFilters: OpenTradesFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    if (page !== 1) {
      handlePageChange(1);
    }
  };

  // Count active filters (excluding status which is always set)
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'status') return false; // Don't count status as it's always set
    if (key === 'buySell' && value === 'all') return false; // Don't count 'all' buy/sell
    return value !== undefined && value !== '';
  }).length;

  // Function to remove a specific filter
  const removeFilter = (key: keyof OpenTradesFilters) => {
    setFilters(prev => ({ ...prev, [key]: key === 'status' ? 'all' : key === 'buySell' ? 'all' : undefined }));
  };
  
  // Render active filter badges
  const renderFilterBadges = () => {
    if (activeFilterCount === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {filters.counterparty && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Counterparty: {filters.counterparty}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('counterparty')} />
          </Badge>
        )}
        {filters.product && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Product: {filters.product}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('product')} />
          </Badge>
        )}
        {filters.sustainability && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Sustainability: {filters.sustainability}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('sustainability')} />
          </Badge>
        )}
        {filters.buySell && filters.buySell !== 'all' && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {filters.buySell === 'buy' ? 'Buy' : 'Sell'} only
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('buySell')} />
          </Badge>
        )}
        {filters.loadingStartDate && (
          <Badge variant="secondary" className="flex items-center gap-1">
            From: {filters.loadingStartDate.toLocaleDateString()}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('loadingStartDate')} />
          </Badge>
        )}
        {filters.loadingEndDate && (
          <Badge variant="secondary" className="flex items-center gap-1">
            To: {filters.loadingEndDate.toLocaleDateString()}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('loadingEndDate')} />
          </Badge>
        )}
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => handleFiltersChange({ status: filters.status, buySell: 'all' })}
          >
            Clear all filters
          </Button>
        )}
      </div>
    );
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
                  className={activeFilterCount > 0 ? "relative border-primary" : ""}
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
            {renderFilterBadges()}
          </CardHeader>
          <CardContent>
            <OpenTradesTable 
              onRefresh={handleRefreshTable} 
              key={`open-trades-${refreshTrigger}-${page}-${JSON.stringify(filters)}`} 
              filterStatus={filters.status}
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
        />
      </div>
    </Layout>
  );
};

export default OpenTradesPage;
