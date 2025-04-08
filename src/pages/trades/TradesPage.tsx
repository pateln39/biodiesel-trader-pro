
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Import our custom components
import PhysicalTradeTable from './PhysicalTradeTable';
import PaperTradeList from './PaperTradeList';

// Import isolated hooks
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PhysicalTrade } from '@/types';

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

  const renderPhysicalTradesTab = () => {
    return (
      <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
        <CardHeader>
          <CardTitle>Physical Trades</CardTitle>
          <CardDescription className="flex justify-between items-center">
            <span>View and manage physical trade positions</span>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
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
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
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
