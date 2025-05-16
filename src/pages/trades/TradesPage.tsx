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

// Import isolated hooks
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PhysicalTrade } from '@/types';
import { exportPhysicalTradesToExcel, exportPaperTradesToExcel } from '@/utils/excelExportUtils';
import { toast } from 'sonner';

const TradesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'physical';
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');
  
  // Parse pagination params from URL
  const paginationParams: PaginationParams = {
    page: pageParam ? parseInt(pageParam) : 1,
    pageSize: pageSizeParam ? parseInt(pageSizeParam) : 15
  };
  
  // Get the active tab from URL
  const activeTab = tabParam === 'paper' ? 'paper' : 'physical';
  const [pageError, setPageError] = React.useState<string | null>(null);
  
  // Load physical trades with pagination from URL
  const { 
    trades, 
    loading: physicalLoading, 
    error: physicalError, 
    refetchTrades,
    pagination
  } = useTrades(paginationParams);
  
  // Load paper trades
  const { 
    paperTrades, 
    isLoading: paperLoading, 
    error: paperError, 
    refetchPaperTrades
  } = usePaperTrades();
  
  // Physical trades are already filtered in the hook
  const physicalTrades = trades as PhysicalTrade[];

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
    // Update URL parameters without using state
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams);
  };
  
  // Handle page change - this is now just a helper for the table
  // The actual navigation is handled by the PaginationNav component directly
  const handlePageChange = (page: number) => {
    // For non-URL operations only
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
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
            pagination={pagination}
            onPageChange={handlePageChange}
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
          <PaperTradeList
            paperTrades={paperTrades}
            isLoading={paperLoading}
            error={paperError}
            refetchPaperTrades={refetchPaperTrades}
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
      </div>
    </Layout>
  );
};

export default TradesPage;
