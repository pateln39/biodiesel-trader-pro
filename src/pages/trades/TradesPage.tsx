import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, AlertCircle, FileDown } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationParams } from '@/types/pagination';

// Import our custom components
import PhysicalTradeTable from './PhysicalTradeTable';
import PaperTradeList from './PaperTradeList';
import TradesFilter from '@/components/trades/TradesFilter';
import PaperTradeUploader from '@/components/trades/PaperTradeUploader';
import BulkOperationStatus from '@/components/trades/BulkOperationStatus';

// Import isolated hooks
import { useFilteredTrades, TradeFilterOptions } from '@/hooks/useFilteredTrades';
import { useTradeFilterOptions } from '@/hooks/useTradeFilterOptions';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { useMovementDateSort, SortConfig } from '@/hooks/useMovementDateSort';
import { PhysicalTrade } from '@/types';
import { exportPhysicalTradesToExcel, exportPaperTradesToExcel } from '@/utils/excelExportUtils';
import { toast } from 'sonner';

const TradesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');
  const sortParam = searchParams.get('sort');
  
  // Use URL parameters as the source of truth for pagination
  const paginationParams: PaginationParams = {
    page: pageParam ? parseInt(pageParam) : 1,
    pageSize: pageSizeParam ? parseInt(pageSizeParam) : 15
  };
  
  const [activeTab, setActiveTab] = useState<string>(tabParam === 'paper' ? 'paper' : 'physical');
  const [pageError, setPageError] = useState<string | null>(null);
  
  // Physical trades filtering state
  const [showTradesFilter, setShowTradesFilter] = useState(false);
  const [tradeFilters, setTradeFilters] = useState<Partial<TradeFilterOptions>>({
    buySell: [],
    product: [],
    sustainability: [],
    incoTerm: [],
    creditStatus: [],
    customsStatus: [],
    contractStatus: [],
    pricingType: [],
    counterparty: []
  });

  // Initialize sorting from URL parameters
  const initSortColumns = (): SortConfig[] => {
    if (!sortParam) return [];
    
    try {
      return sortParam.split(',').map(sortStr => {
        const [column, direction] = sortStr.split(':');
        return {
          column: column as any,
          direction: (direction as 'asc' | 'desc') || 'asc'
        };
      });
    } catch {
      return [];
    }
  };

  // Initialize sorting state
  const { sortColumns, handleSort, clearSort } = useMovementDateSort(initSortColumns());

  // Initialize filters from URL parameters
  useEffect(() => {
    const filtersFromUrl: Partial<TradeFilterOptions> = {
      buySell: [],
      product: [],
      sustainability: [],
      incoTerm: [],
      creditStatus: [],
      customsStatus: [],
      contractStatus: [],
      pricingType: [],
      counterparty: []
    };

    // Parse array filters from URL
    const arrayFilters = ['buySell', 'product', 'sustainability', 'incoTerm', 'creditStatus', 'customsStatus', 'contractStatus', 'pricingType', 'counterparty'];
    arrayFilters.forEach(filter => {
      const value = searchParams.get(filter);
      if (value) {
        (filtersFromUrl as any)[filter] = value.split(',');
      }
    });

    // Parse text filters
    const tradeReference = searchParams.get('tradeReference');
    if (tradeReference) {
      filtersFromUrl.tradeReference = tradeReference;
    }

    // Parse date filters
    const dateFilters = [
      'loadingPeriodStartFrom', 'loadingPeriodStartTo',
      'loadingPeriodEndFrom', 'loadingPeriodEndTo',
      'pricingPeriodStartFrom', 'pricingPeriodStartTo',
      'pricingPeriodEndFrom', 'pricingPeriodEndTo'
    ];
    dateFilters.forEach(filter => {
      const value = searchParams.get(filter);
      if (value) {
        (filtersFromUrl as any)[filter] = new Date(value);
      }
    });

    setTradeFilters(filtersFromUrl);
  }, [searchParams]);

  // Update URL when sorting changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    if (sortColumns.length > 0) {
      const sortString = sortColumns.map(sc => `${sc.column}:${sc.direction}`).join(',');
      newParams.set('sort', sortString);
    } else {
      newParams.delete('sort');
    }
    
    setSearchParams(newParams);
  }, [sortColumns, setSearchParams]);

  // Load physical trades with filtering and sorting
  const { 
    trades, 
    loading: physicalLoading, 
    error: physicalError, 
    refetchTrades,
    pagination: physicalPagination,
    activeFilterCount
  } = useFilteredTrades(tradeFilters, paginationParams, sortColumns);
  
  // Load paper trades with pagination from URL
  const { 
    paperTrades, 
    isLoading: paperLoading, 
    error: paperError, 
    refetchPaperTrades,
    pagination: paperPagination
  } = usePaperTrades(paginationParams);

  // Load filter options for physical trades
  const { options: filterOptions } = useTradeFilterOptions();
  
  const physicalTrades = trades as PhysicalTrade[];

  // Update active tab based on URL parameter
  useEffect(() => {
    if (tabParam === 'paper') {
      setActiveTab('paper');
    } else if (tabParam === 'physical') {
      setActiveTab('physical');
    }
  }, [tabParam]);
  
  // Error handling across both trade types
  useEffect(() => {
    const combinedError = physicalError || paperError;
    if (combinedError) {
      setPageError(combinedError instanceof Error ? combinedError.message : 'Unknown error occurred');
    } else {
      setPageError(null);
    }
  }, [physicalError, paperError]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL parameters without navigation
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    // Reset to page 1 when changing tabs
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  // Handle page change - update URL parameters
  const handlePageChange = (page: number) => {
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update URL parameters
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  // Handle filter changes for physical trades - Updated to accept Partial<TradeFilterOptions>
  const handleFilterChange = (filters: Partial<TradeFilterOptions>) => {
    setTradeFilters(filters);
    
    // Update URL parameters
    const newParams = new URLSearchParams(searchParams);
    
    // Remove existing filter parameters
    const filterKeys = [
      'tradeReference', 'buySell', 'product', 'sustainability', 'incoTerm', 
      'creditStatus', 'customsStatus', 'contractStatus', 'pricingType', 'counterparty',
      'loadingPeriodStartFrom', 'loadingPeriodStartTo',
      'loadingPeriodEndFrom', 'loadingPeriodEndTo',
      'pricingPeriodStartFrom', 'pricingPeriodStartTo',
      'pricingPeriodEndFrom', 'pricingPeriodEndTo'
    ];
    filterKeys.forEach(key => newParams.delete(key));
    
    // Add new filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          newParams.set(key, value.join(','));
        } else if (value instanceof Date) {
          newParams.set(key, value.toISOString().split('T')[0]);
        } else if (typeof value === 'string' && value.trim() !== '') {
          newParams.set(key, value);
        }
      }
    });
    
    // Reset to page 1 when filters change
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Export handlers
  const handleExportPhysicalTrades = async () => {
    try {
      toast.info("Exporting trades", { description: "Preparing Excel file..." });
      const fileName = await exportPhysicalTradesToExcel();
      toast.success("Export complete", { description: `Saved as ${fileName}` });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", { 
        description: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  };

  const handleExportPaperTrades = async () => {
    try {
      toast.info("Exporting paper trades", { description: "Preparing Excel file..." });
      const fileName = await exportPaperTradesToExcel();
      toast.success("Export complete", { description: `Saved as ${fileName}` });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", { 
        description: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  };

  const showErrorAlert = () => {
    if (!pageError) return null;
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {pageError}
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (activeTab === 'physical') {
                refetchTrades();
              } else {
                refetchPaperTrades();
              }
            }}>
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderPhysicalTradesTab = () => {
    return (
      <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
        <CardHeader>
          <CardTitle>Physical Trades</CardTitle>
          <CardDescription className="flex justify-between items-center">
            <span>View and manage physical trade positions</span>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTradesFilter(true)}
                className="flex items-center gap-1"
              >
                <Filter className="mr-2 h-4 w-4" /> 
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPhysicalTrades}>
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhysicalTradeTable 
            trades={physicalTrades}
            loading={physicalLoading}
            error={physicalError}
            refetchTrades={refetchTrades}
            pagination={physicalPagination}
            onPageChange={handlePageChange}
            sortColumns={sortColumns}
            onSort={handleSort}
          />
        </CardContent>
      </Card>
    );
  };

  const renderPaperTradesTab = () => {
    return (
      <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
        <CardHeader>
          <CardTitle>Paper Trades</CardTitle>
          <CardDescription className="flex justify-between items-center">
            <span>View and manage paper trade positions</span>
            <div className="flex space-x-2">
              <PaperTradeUploader />
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPaperTrades}>
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkOperationStatus />
          <PaperTradeList
            paperTrades={paperTrades}
            isLoading={paperLoading}
            error={paperError}
            refetchPaperTrades={refetchPaperTrades}
            pagination={paperPagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <div className="flex items-center gap-2">
            <Link to="/trades/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Trade
              </Button>
            </Link>
          </div>
        </div>

        {pageError && showErrorAlert()}

        {/* Tabs for Physical and Paper Trades */}
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="physical">Physical Trades</TabsTrigger>
            <TabsTrigger value="paper">Paper Trades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="physical">
            {renderPhysicalTradesTab()}
          </TabsContent>
          
          <TabsContent value="paper">
            {renderPaperTradesTab()}
          </TabsContent>
        </Tabs>

        {/* Filter Dialog for Physical Trades */}
        <TradesFilter
          open={showTradesFilter}
          onOpenChange={setShowTradesFilter}
          filterOptions={tradeFilters}
          availableOptions={filterOptions}
          onFilterChange={handleFilterChange}
        />
      </div>
    </Layout>
  );
};

export default TradesPage;
