
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PaperTrade } from '@/types/paper';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { formatDate } from '@/utils/tradeUtils';

interface PaperTradeTableProps {
  trades: PaperTrade[];
  onEdit: (trade: PaperTrade) => void;
  onDelete: (tradeId: string) => void;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({ trades, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trade Ref</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>B/S</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No paper trades found
              </TableCell>
            </TableRow>
          ) : (
            trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="font-medium">{trade.tradeReference}</TableCell>
                <TableCell>{trade.broker}</TableCell>
                <TableCell>{formatDate(trade.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{trade.product}</Badge>
                </TableCell>
                <TableCell>{trade.quantity} MT</TableCell>
                <TableCell>
                  <Badge variant={trade.buySell === 'buy' ? 'success' : 'destructive'}>
                    {trade.buySell === 'buy' ? 'Buy' : 'Sell'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(trade)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(trade.id)}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaperTradeTable;
