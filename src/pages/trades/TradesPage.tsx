
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/tradeUtils';
import { 
  Trade, 
  PhysicalTrade, 
  PaperTrade 
} from '@/types';
import { useTrades } from '@/hooks/useTrades';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const TradesPage = () => {
  const { trades, loading, error, refetchTrades } = useTrades();
  const [activeTab, setActiveTab] = useState<"physical" | "paper">("physical");

  // Filter trades based on the active tab
  const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
  const paperTrades = trades.filter(trade => trade.tradeType === 'paper') as PaperTrade[];

  // Show error toast if query fails
  useEffect(() => {
    if (error) {
      toast.error('Failed to load trades', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }, [error]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <Link to="/trades/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Trade
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-md border shadow-sm">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="font-semibold">All Trades</h2>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
          
          <Tabs defaultValue="physical" onValueChange={(value) => setActiveTab(value as "physical" | "paper")} className="w-full">
            <div className="px-4 pt-2">
              <TabsList>
                <TabsTrigger value="physical">Physical Trades</TabsTrigger>
                <TabsTrigger value="paper">Paper Trades</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="physical" className="pt-2">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="p-8 flex flex-col items-center text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <div>
                      <h3 className="font-medium">Failed to load trades</h3>
                      <p className="text-muted-foreground text-sm">
                        {error instanceof Error ? error.message : 'Unknown error occurred'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Reference</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Counterparty</th>
                        <th className="text-left p-3 font-medium">Buy/Sell</th>
                        <th className="text-left p-3 font-medium">INCO Terms</th>
                        <th className="text-left p-3 font-medium">Product</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {physicalTrades.length > 0 ? (
                        physicalTrades.map((trade) => (
                          <tr key={trade.id} className="border-t hover:bg-muted/50">
                            <td className="p-3">
                              <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                                {trade.tradeReference}
                              </Link>
                            </td>
                            <td className="p-3 capitalize">{trade.physicalType || 'spot'}</td>
                            <td className="p-3">{trade.counterparty}</td>
                            <td className="p-3 capitalize">{trade.buySell}</td>
                            <td className="p-3">{trade.incoTerm}</td>
                            <td className="p-3">{trade.product}</td>
                            <td className="p-3 text-center">
                              <Link to={`/trades/${trade.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            No physical trades found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="paper" className="pt-2">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="p-8 flex flex-col items-center text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <div>
                      <h3 className="font-medium">Failed to load trades</h3>
                      <p className="text-muted-foreground text-sm">
                        {error instanceof Error ? error.message : 'Unknown error occurred'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Reference</th>
                        <th className="text-left p-3 font-medium">Broker</th>
                        <th className="text-left p-3 font-medium">Instrument</th>
                        <th className="text-right p-3 font-medium">Price</th>
                        <th className="text-right p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">Created</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paperTrades.length > 0 ? (
                        paperTrades.map((trade) => (
                          <tr key={trade.id} className="border-t hover:bg-muted/50">
                            <td className="p-3">
                              <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                                {trade.tradeReference}
                              </Link>
                            </td>
                            <td className="p-3">{trade.broker}</td>
                            <td className="p-3">{trade.instrument}</td>
                            <td className="p-3 text-right">{trade.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right">{trade.quantity} MT</td>
                            <td className="p-3">{formatDate(trade.createdAt)}</td>
                            <td className="p-3 text-center">
                              <Link to={`/trades/${trade.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            No paper trades found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default TradesPage;
