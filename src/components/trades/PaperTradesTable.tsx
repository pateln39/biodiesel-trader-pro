
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PaperTrade } from '@/types/paper';
import { deletePaperTrade } from '@/utils/paperTradeDeleteUtils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface PaperTradesTableProps {
  trades: PaperTrade[];
  loading?: boolean;
}

const PaperTradesTable: React.FC<PaperTradesTableProps> = ({ trades, loading }) => {
  const queryClient = useQueryClient();
  const [tradeToDelete, setTradeToDelete] = useState<PaperTrade | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return;
    
    try {
      setIsDeleting(true);
      await deletePaperTrade(tradeToDelete.id);
      // Invalidate all paper trade related queries
      queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      queryClient.invalidateQueries({ queryKey: ['filteredPaperTrades'] });
      queryClient.invalidateQueries({ queryKey: ['filteredPaperMTM'] });
      queryClient.invalidateQueries({ queryKey: ['paperMtmPositions'] });
      toast.success('Paper trade deleted successfully');
      setTradeToDelete(null);
    } catch (error) {
      toast.error('Failed to delete paper trade');
      setTradeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Loading paper trades...</p>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>No paper trades found.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trade Reference</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>B/S</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell className="font-medium">
                <Link 
                  to={`/trades/paper/${trade.id}/edit`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {trade.tradeReference}
                </Link>
              </TableCell>
              <TableCell>{trade.counterparty}</TableCell>
              <TableCell>{trade.broker || '-'}</TableCell>
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
                {trade.legs.map(leg => leg.period).join(', ')}
              </TableCell>
              <TableCell>
                {trade.legs.map(leg => (
                  <Badge key={leg.id} variant={
                    leg.relationshipType === 'FP' ? 'default' : 
                    leg.relationshipType === 'DIFF' ? 'secondary' : 'outline'
                  } className="mr-1">
                    {leg.relationshipType}
                  </Badge>
                ))}
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
                      <Link to={`/trades/paper/${trade.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
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
            <AlertDialogTitle>Delete Paper Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete paper trade "{tradeToDelete?.tradeReference}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrade}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaperTradesTable;
