
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, AlertCircle, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Import our custom components
import PhysicalTradeTable from './PhysicalTradeTable';
import PaperTradeList from './PaperTradeList';

// Import isolated hooks
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PhysicalTrade } from '@/types';
import { exportPhysicalTradesToExcel, exportPaperTradesToExcel } from '@/utils/excelExportUtils';

const TradesPage = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabParam === 'paper' ? 'paper' : 'physical');
  const [pageError, setPageError] = useState<string | null>(null);
  
  // Load physical trades
  const { 
    trades, 
    loading: physicalLoading, 
    error: physicalError, 
    refetchTrades
  } = useTrades();
  
  // Load paper trades
  const { 
    paperTrades, 
    isLoading: paperLoading, 
    error: paperError, 
    refetchPaperTrades
  } = usePaperTrades();
  
  const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];

  // Error handling across both trade types
  useEffect(() => {
    const combinedError = physicalError || paperError;
    if (combinedError) {
      setPageError(combinedError instanceof Error ? combinedError.message : 'Unknown error occurred');
    } else {
      setPageError(null);
    }
  }, [physicalError, paperError]);

  // Update active tab based on URL parameter
  useEffect(() => {
    if (tabParam === 'paper') {
      setActiveTab('paper');
    } else if (tabParam === 'physical') {
      setActiveTab('physical');
    }
  }, [tabParam]);

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

  const handleExportPhysicalTrades = () => {
    try {
      // Transform the trades data to match the expected format
      const exportData = physicalTrades.flatMap((trade) => {
        return trade.legs.map(leg => ({
          reference: leg.legReference,
          buy_sell: leg.buySell,
          incoterm: leg.incoTerm,
          quantity: leg.quantity,
          sustainability: leg.sustainability,
          product: leg.product,
          loading_start: leg.loadingPeriodStart,
          loading_end: leg.loadingPeriodEnd,
          counterparty: trade.counterparty,
          pricing_type: leg.pricingType,
          formula: leg.formula ? JSON.stringify(leg.formula) : '',
          comments: leg.comments,
          customs_status: leg.customsStatus,
          contract_status: leg.contractStatus
        }));
      });
      
      exportPhysicalTradesToExcel(exportData);
      toast.success("Export successful", {
        description: "Physical trades have been exported to Excel"
      });
    } catch (error) {
      console.error("Error exporting physical trades:", error);
      toast.error("Export failed", {
        description: "There was an error exporting physical trades"
      });
    }
  };

  const handleExportPaperTrades = () => {
    try {
      // Transform the paper trades data to match the expected format
      const exportData = paperTrades.flatMap((trade) => {
        return trade.legs.map((leg, legIndex) => {
          const displayReference = `${trade.tradeReference}${legIndex > 0 ? `-${String.fromCharCode(97 + legIndex)}` : '-a'}`;
          let productDisplay = leg.product;
          
          if (leg.relationshipType && leg.rightSide?.product) {
            productDisplay = `${leg.product} / ${leg.rightSide.product}`;
          }
          
          let price = leg.price;
          if (leg.relationshipType === 'spread' && leg.rightSide?.price) {
            price = leg.price - leg.rightSide.price;
          }
          
          return {
            reference: displayReference,
            broker: leg.broker || trade.broker,
            products: productDisplay,
            period: leg.period,
            quantity: leg.quantity,
            price: price
          };
        });
      });
      
      exportPaperTradesToExcel(exportData);
      toast.success("Export successful", {
        description: "Paper trades have been exported to Excel"
      });
    } catch (error) {
      console.error("Error exporting paper trades:", error);
      toast.error("Export failed", {
        description: "There was an error exporting paper trades"
      });
    }
  };

  const renderPhysicalTradesTab = () => {
    return (
      <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
        <CardHeader>
          <CardTitle>Physical Trades</CardTitle>
          <CardDescription className="flex justify-between items-center">
            <span>View and manage physical trade positions</span>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExportPhysicalTrades}
                    >
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export to Excel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
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
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportPaperTrades}
                    >
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export to Excel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
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
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
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
