
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { mockTrades } from '@/data/mockData';
import { formatDate } from '@/utils/tradeUtils';

const TradesPage = () => {
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
                {mockTrades.length > 0 ? (
                  mockTrades.map((trade) => (
                    <tr key={trade.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                          {trade.tradeReference}
                        </Link>
                      </td>
                      <td className="p-3 capitalize">{trade.tradeType}</td>
                      <td className="p-3">
                        {trade.tradeType === 'physical' 
                          ? (trade as any).counterparty 
                          : (trade as any).broker}
                      </td>
                      <td className="p-3">
                        {trade.tradeType === 'physical' 
                          ? (trade as any).product 
                          : (trade as any).instrument}
                      </td>
                      <td className="p-3 text-right">
                        {trade.tradeType === 'physical' 
                          ? `${(trade as any).quantity} ${(trade as any).unit}` 
                          : `${(trade as any).quantity} MT`}
                      </td>
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
                      No trades found. Create your first trade.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TradesPage;
