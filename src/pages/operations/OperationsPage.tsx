
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateUtils';
import { useTrades } from '@/hooks/useTrades';
import { PhysicalTrade } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Movement } from '@/types/common';

const OperationsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('open-trades');
  
  const { 
    trades, 
    loading: tradesLoading, 
    error: tradesError, 
    refetchTrades
  } = useTrades();
  
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
            <div className="rounded-md border overflow-x-auto bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10">
                    <TableHead>Reference</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead className="text-right">Scheduled</TableHead>
                    <TableHead className="text-right">Open Quantity</TableHead>
                    <TableHead>Loading Period</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Loading trades...
                      </TableCell>
                    </TableRow>
                  ) : tradesError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-destructive">
                        Error loading trades. 
                        <Button 
                          variant="link" 
                          className="ml-2" 
                          onClick={() => refetchTrades()}
                        >
                          Try again
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : physicalTrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No open trades found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    physicalTrades.map((trade) => {
                      const scheduledQuantity = movements
                        .filter(m => m.tradeId === trade.id)
                        .reduce((sum, m) => sum + (m.scheduledQuantity || 0), 0);
                      
                      const openQuantity = calculateOpenQuantity(
                        trade.quantity,
                        trade.tolerance || 0,
                        scheduledQuantity
                      );
                      
                      return (
                        <TableRow key={trade.id} className="border-b border-white/5 hover:bg-brand-navy/80">
                          <TableCell>
                            <Link to={`/trades/${trade.id}`} className="hover:underline">
                              {trade.tradeReference}
                            </Link>
                          </TableCell>
                          <TableCell>{trade.counterparty}</TableCell>
                          <TableCell>{trade.product}</TableCell>
                          <TableCell className="text-right">{trade.quantity} {trade.unit}</TableCell>
                          <TableCell className="text-right">{scheduledQuantity} {trade.unit}</TableCell>
                          <TableCell className="text-right">{openQuantity.toFixed(2)} {trade.unit}</TableCell>
                          <TableCell>
                            {formatDate(trade.loadingPeriodStart)} - {formatDate(trade.loadingPeriodEnd)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Link to={`/trades/${trade.id}`}>
                              <Button variant="ghost" size="sm">Schedule</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <div className="rounded-md border overflow-x-auto bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10">
                    <TableHead>Trade Ref</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Nominated Date</TableHead>
                    <TableHead>Loadport</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Loading movements...
                      </TableCell>
                    </TableRow>
                  ) : movementsError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-destructive">
                        Error loading movements. 
                        <Button 
                          variant="link" 
                          className="ml-2" 
                          onClick={() => refetchMovements()}
                        >
                          Try again
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No movements scheduled.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((movement) => {
                      const trade = physicalTrades.find(t => t.id === movement.tradeId);
                      
                      return (
                        <TableRow key={movement.id} className="border-b border-white/5 hover:bg-brand-navy/80">
                          <TableCell>
                            {trade ? (
                              <Link to={`/trades/${movement.tradeId}`} className="hover:underline">
                                {trade.tradeReference}
                                {movement.legId && ' (Leg)'}
                              </Link>
                            ) : (
                              `Trade ${movement.tradeId}`
                            )}
                          </TableCell>
                          <TableCell>{movement.vesselName || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            {movement.scheduledQuantity || movement.quantity} {trade?.unit}
                          </TableCell>
                          <TableCell>{movement.nominatedDate ? formatDate(movement.nominatedDate) : 'N/A'}</TableCell>
                          <TableCell>{movement.loadport || 'N/A'}</TableCell>
                          <TableCell className="capitalize">{movement.status}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OperationsPage;
