
import React, { useEffect } from 'react';
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

const TradesPage = () => {
  const { trades, loading, error, refetchTrades } = useTrades();

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
                    <th className="text-left p-3 font-medium">Counterparty/Broker</th>
                    <th className="text-left p-3 font-medium">Product/Instrument</th>
                    <th className="text-right p-3 font-medium">Quantity</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length > 0 ? (
                    trades.map((trade) => {
                      const isPhysical = trade.tradeType === 'physical';
                      const physicalTrade = isPhysical ? trade as PhysicalTrade : null;
                      const paperTrade = !isPhysical ? trade as PaperTrade : null;
                      
                      return (
                        <tr key={trade.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">
                            <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                              {trade.tradeReference}
                            </Link>
                          </td>
                          <td className="p-3 capitalize">{trade.tradeType}</td>
                          <td className="p-3">
                            {isPhysical ? physicalTrade?.counterparty : paperTrade?.broker}
                          </td>
                          <td className="p-3">
                            {isPhysical ? physicalTrade?.product : paperTrade?.instrument}
                          </td>
                          <td className="p-3 text-right">
                            {isPhysical 
                              ? `${physicalTrade?.quantity} ${physicalTrade?.unit}` 
                              : `${paperTrade?.quantity} MT`}
                          </td>
                          <td className="p-3">{formatDate(trade.createdAt)}</td>
                          <td className="p-3 text-center">
                            <Link to={`/trades/${trade.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No trades found. Create your first trade.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TradesPage;
