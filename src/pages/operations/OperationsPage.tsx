
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrades } from '@/hooks/useTrades';
import { PhysicalTrade, Movement } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Import the same components used in the physical trades tab
import PhysicalTradeTable from '@/pages/trades/PhysicalTradeTable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateUtils';

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
    
    // Map the data to match our Movement type
    return (data || []).map(item => ({
      id: item.id,
      tradeId: item.trade_leg_id, // Fixed: use trade_leg_id instead of trade_id
      movementReference: item.movement_reference || item.id,
      status: item.status,
      nominatedDate: item.nominated_date ? new Date(item.nominated_date) : new Date(),
      quantity: item.bl_quantity || 0, // Fixed: ensure quantity is always set
      legId: item.trade_leg_id, // Fixed: use trade_leg_id instead of leg_id
      scheduledQuantity: item.bl_quantity || 0, // Fixed: map to the correct field
      vesselName: item.vessel_name,
      loadport: item.loadport,
      disport: item.disport,
      // Additional fields
      actualized: item.actualized,
      actualized_date: item.actualized_date,
      actualized_quantity: item.actualized_quantity,
      bl_date: item.bl_date,
      bl_quantity: item.bl_quantity,
      cash_flow_date: item.cash_flow_date,
      comments: item.comments,
      created_at: item.created_at
    }));
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
            <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <CardHeader>
                <CardTitle>Open Trades</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>View and manage open trade positions</span>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhysicalTradeTable 
                  trades={physicalTrades}
                  loading={tradesLoading}
                  error={tradesError}
                  refetchTrades={refetchTrades}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <CardHeader>
                <CardTitle>Movements</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>View and manage scheduled movements</span>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="data-table-container">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OperationsPage;
