import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhysicalTrade } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Trash2, Eye, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formulaToString } from '@/modules/trade/utils/formulaUtils';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
}

export default function PhysicalTradeTable({
  trades,
  loading,
  error,
  refetchTrades
}: PhysicalTradeTableProps) {
  const navigate = useNavigate();
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredTrades, setFilteredTrades] = useState<PhysicalTrade[]>(trades);

  useEffect(() => {
    let filtered = [...trades];
    
    // Apply tab filtering
    if (activeTab === 'active') {
      filtered = filtered.filter(trade => !trade.isCancelled);
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(trade => trade.isCancelled);
    }
    
    // Apply sorting if configured
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof PhysicalTrade];
        const bValue = b[sortConfig.key as keyof PhysicalTrade];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredTrades(filtered);
  }, [trades, activeTab, sortConfig]);

  const handleRefresh = () => {
    refetchTrades();
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrades(filteredTrades.map(trade => trade.id));
    } else {
      setSelectedTrades([]);
    }
  };

  const handleSelectTrade = (tradeId: string, checked: boolean) => {
    if (checked) {
      setSelectedTrades([...selectedTrades, tradeId]);
    } else {
      setSelectedTrades(selectedTrades.filter(id => id !== tradeId));
    }
  };

  const handleViewTrade = (tradeId: string) => {
    navigate(`/trades/${tradeId}`);
  };

  const handleEditTrade = (tradeId: string) => {
    navigate(`/trades/${tradeId}/edit`);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    try {
      // Implement delete logic here
      toast.success('Trade deleted successfully');
      refetchTrades();
    } catch (error) {
      toast.error('Failed to delete trade');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      // Implement bulk delete logic here
      toast.success(`${selectedTrades.length} trades deleted successfully`);
      setSelectedTrades([]);
      refetchTrades();
    } catch (error) {
      toast.error('Failed to delete selected trades');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading trades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-red-800 font-medium">Error loading trades</h3>
        <p className="text-red-600">{error.message}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={handleRefresh}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Trades</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            
            {selectedTrades.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteSelected}
              >
                Delete Selected ({selectedTrades.length})
              </Button>
            )}
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedTrades.length === filteredTrades.length && filteredTrades.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('tradeReference')}>
                  Reference
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('counterparty')}>
                  Counterparty
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('product')}>
                  Product
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('quantity')}>
                  Quantity
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('buySell')}>
                  Buy/Sell
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('loadingPeriodStart')}>
                  Loading Period
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('pricingPeriodStart')}>
                  Pricing Period
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                  Created
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('isConfirmed')}>
                  Status
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedTrades.includes(trade.id)}
                        onCheckedChange={(checked) => handleSelectTrade(trade.id, checked === true)}
                      />
                    </TableCell>
                    <TableCell>{trade.tradeReference}</TableCell>
                    <TableCell>{trade.counterparty}</TableCell>
                    <TableCell>{trade.product}</TableCell>
                    <TableCell>{trade.quantity} {trade.unit}</TableCell>
                    <TableCell className={trade.buySell === 'buy' ? 'text-green-600' : 'text-red-600'}>
                      {trade.buySell}
                    </TableCell>
                    <TableCell>
                      {trade.loadingPeriodStart && format(new Date(trade.loadingPeriodStart), 'MMM d, yyyy')}
                      {' - '}
                      {trade.loadingPeriodEnd && format(new Date(trade.loadingPeriodEnd), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {trade.pricingPeriodStart && format(new Date(trade.pricingPeriodStart), 'MMM d, yyyy')}
                      {' - '}
                      {trade.pricingPeriodEnd && format(new Date(trade.pricingPeriodEnd), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{trade.createdAt && format(new Date(trade.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className={trade.isActive === true ? 'text-green-500' : 'text-red-500'}>
                      {trade.isActive === true ? 'Active' : 'Inactive'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTrade(trade.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTrade(trade.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTrade(trade.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
