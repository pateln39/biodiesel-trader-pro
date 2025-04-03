
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/utils/dateUtils';
import { useTrades } from '@/hooks/useTrades';
import { PhysicalTrade } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Movement } from '@/types/common';

const OperationsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('open-trades');
  
  // Use the existing trades hook to fetch trades
  const { 
    trades, 
    loading: tradesLoading, 
    error: tradesError, 
    refetchTrades
  } = useTrades();
  
  // Fetch movements data
  const fetchMovements = async (): Promise<Movement[]> => {
    const { data, error } = await supabase
      .from('movements')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  };
  
  const { 
    data: movements = [], 
    isLoading: movementsLoading,
    error: movementsError,
    refetch: refetchMovements
  } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements
  });
  
  // Filter to get only physical trades
  const physicalTrades = trades.filter(trade => 
    trade.tradeType === 'physical'
  ) as PhysicalTrade[];

  const calculateOpenQuantity = (total: number, tolerance: number, scheduled: number) => {
    const maxQuantity = total * (1 + tolerance / 100);
    return maxQuantity - scheduled;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Calendar View
          </Button>
        </div>

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="open-trades">Open Trades</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="open-trades" className="space-y-4">
            <div className="bg-card rounded-md border shadow-sm">
              <div className="p-4 flex justify-between items-center border-b">
                <h2 className="font-semibold">Open Trades</h2>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Reference</th>
                      <th className="text-left p-3 font-medium">Counterparty</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium">Total Quantity</th>
                      <th className="text-right p-3 font-medium">Scheduled</th>
                      <th className="text-right p-3 font-medium">Open Quantity</th>
                      <th className="text-left p-3 font-medium">Loading Period</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradesLoading ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center">
                          Loading trades...
                        </td>
                      </tr>
                    ) : tradesError ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-destructive">
                          Error loading trades. 
                          <Button 
                            variant="link" 
                            className="ml-2" 
                            onClick={() => refetchTrades()}
                          >
                            Try again
                          </Button>
                        </td>
                      </tr>
                    ) : physicalTrades.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No open trades found.
                        </td>
                      </tr>
                    ) : (
                      physicalTrades.map((trade) => {
                        // Calculate scheduled quantity for this trade
                        const scheduledQuantity = movements
                          .filter(m => m.tradeId === trade.id)
                          .reduce((sum, m) => sum + (m.scheduledQuantity || 0), 0);
                        
                        // Calculate open quantity
                        const openQuantity = calculateOpenQuantity(
                          trade.quantity,
                          trade.tolerance || 0,
                          scheduledQuantity
                        );
                        
                        return (
                          <tr key={trade.id} className="border-t hover:bg-muted/50">
                            <td className="p-3">
                              <Link to={`/operations/${trade.id}`} className="text-primary hover:underline">
                                {trade.tradeReference}
                              </Link>
                            </td>
                            <td className="p-3">{trade.counterparty}</td>
                            <td className="p-3">{trade.product}</td>
                            <td className="p-3 text-right">{trade.quantity} {trade.unit}</td>
                            <td className="p-3 text-right">{scheduledQuantity} {trade.unit}</td>
                            <td className="p-3 text-right">{openQuantity.toFixed(2)} {trade.unit}</td>
                            <td className="p-3">
                              {formatDate(trade.loadingPeriodStart)} - {formatDate(trade.loadingPeriodEnd)}
                            </td>
                            <td className="p-3 text-center">
                              <Link to={`/operations/${trade.id}`}>
                                <Button variant="ghost" size="sm">Schedule</Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <div className="bg-card rounded-md border shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Recent Movements</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Trade Ref</th>
                      <th className="text-left p-3 font-medium">Vessel</th>
                      <th className="text-right p-3 font-medium">Quantity</th>
                      <th className="text-left p-3 font-medium">Nominated Date</th>
                      <th className="text-left p-3 font-medium">Loadport</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsLoading ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center">
                          Loading movements...
                        </td>
                      </tr>
                    ) : movementsError ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-destructive">
                          Error loading movements. 
                          <Button 
                            variant="link" 
                            className="ml-2" 
                            onClick={() => refetchMovements()}
                          >
                            Try again
                          </Button>
                        </td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          No movements scheduled.
                        </td>
                      </tr>
                    ) : (
                      movements.map((movement) => {
                        const trade = physicalTrades.find(t => t.id === movement.tradeId);
                        
                        return (
                          <tr key={movement.id} className="border-t hover:bg-muted/50">
                            <td className="p-3">
                              {trade ? (
                                <Link to={`/trades/${movement.tradeId}`} className="text-primary hover:underline">
                                  {trade.tradeReference}
                                  {movement.legId && ' (Leg)'}
                                </Link>
                              ) : (
                                `Trade ${movement.tradeId}`
                              )}
                            </td>
                            <td className="p-3">{movement.vesselName || 'N/A'}</td>
                            <td className="p-3 text-right">{movement.scheduledQuantity || movement.quantity} {trade?.unit}</td>
                            <td className="p-3">{movement.nominatedDate ? formatDate(movement.nominatedDate) : 'N/A'}</td>
                            <td className="p-3">{movement.loadport || 'N/A'}</td>
                            <td className="p-3 capitalize">{movement.status}</td>
                            <td className="p-3 text-center">
                              <Button variant="ghost" size="sm">View</Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OperationsPage;
