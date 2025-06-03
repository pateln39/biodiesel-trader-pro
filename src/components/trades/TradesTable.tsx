
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Copy, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trade } from '@/types/trade';
import { useTrades } from '@/hooks/useTrades';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface TradesTableProps {
  trades: Trade[];
  loading?: boolean;
}

const TradesTable: React.FC<TradesTableProps> = ({ trades, loading }) => {
  const { copyTrade, deleteTrade } = useTrades();
  const queryClient = useQueryClient();
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);

  const handleCopyTrade = async (trade: Trade) => {
    try {
      await copyTrade.mutateAsync(trade);
      // Invalidate all trade-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['filteredTrades'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      queryClient.invalidateQueries({ queryKey: ['filteredPhysicalMTM'] });
      queryClient.invalidateQueries({ queryKey: ['physical-mtm-positions'] });
      toast.success('Trade copied successfully');
    } catch (error) {
      toast.error('Failed to copy trade');
    }
  };

  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return;
    
    try {
      await deleteTrade.mutateAsync(tradeToDelete.id);
      // Invalidate all trade-related queries
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['filteredTrades'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      queryClient.invalidateQueries({ queryKey: ['filteredPhysicalMTM'] });
      queryClient.invalidateQueries({ queryKey: ['physical-mtm-positions'] });
      toast.success('Trade deleted successfully');
      setTradeToDelete(null);
    } catch (error) {
      toast.error('Failed to delete trade');
      setTradeToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Loading trades...</p>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>No trades found.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trade Reference</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>B/S</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Loading Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell className="font-medium">
                <Link 
                  to={`/trades/${trade.id}/edit`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {trade.tradeReference}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {trade.tradeType}
                  {trade.physicalType && ` - ${trade.physicalType}`}
                </Badge>
              </TableCell>
              <TableCell>{trade.counterparty}</TableCell>
              <TableCell>
                {trade.legs.map(leg => leg.product).join(', ')}
              </TableCell>
              <TableCell>
                {trade.legs.map(leg => (
                  <Badge key={leg.id} variant={leg.buySell === 'buy' ? 'default' : 'outline'} className="mr-1">
                    {leg.buySell}
                  </Badge>
                ))}
              </TableCell>
              <TableCell className="text-right">
                {trade.legs.reduce((total, leg) => total + leg.quantity, 0).toLocaleString()} MT
              </TableCell>
              <TableCell>
                {trade.legs[0]?.loadingPeriodStart && trade.legs[0]?.loadingPeriodEnd ? (
                  <div className="text-sm">
                    <div>{new Date(trade.legs[0].loadingPeriodStart).toLocaleDateString()}</div>
                    <div className="text-muted-foreground">to {new Date(trade.legs[0].loadingPeriodEnd).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {trade.legs[0]?.contractStatus || 'Open'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/trades/${trade.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleCopyTrade(trade)}
                      disabled={copyTrade.isPending}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copyTrade.isPending ? 'Copying...' : 'Copy'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTradeToDelete(trade)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!tradeToDelete} onOpenChange={() => setTradeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete trade "{tradeToDelete?.tradeReference}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrade}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TradesTable;
