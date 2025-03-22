
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, AlertCircle } from 'lucide-react';
import { Layout } from '@/core/components';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our custom components
import { PhysicalTradeTable, PaperTradeList } from '@/modules/trade/components';

// Import isolated hooks
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PhysicalTrade } from '@/types';

const TradesPage = () => {
  const [activeTab, setActiveTab] = useState<string>("physical");
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
  React.useEffect(() => {
    const combinedError = physicalError || paperError;
    if (combinedError) {
      setPageError(combinedError instanceof Error ? combinedError.message : 'Unknown error occurred');
    } else {
      setPageError(null);
    }
  }, [physicalError, paperError]);

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
      <div className="bg-card rounded-md border shadow-sm">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">Physical Trades</h2>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
        
        <div className="pt-2">
          <PhysicalTradeTable 
            trades={physicalTrades}
            loading={physicalLoading}
            error={physicalError}
            refetchTrades={refetchTrades}
          />
        </div>
      </div>
    );
  };

  const renderPaperTradesTab = () => {
    return (
      <div className="bg-card rounded-md border shadow-sm">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">Paper Trades</h2>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
        
        <div className="pt-2">
          <PaperTradeList
            paperTrades={paperTrades}
            isLoading={paperLoading}
            error={paperError}
            refetchPaperTrades={refetchPaperTrades}
          />
        </div>
      </div>
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
        <Tabs defaultValue="physical" onValueChange={setActiveTab}>
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
