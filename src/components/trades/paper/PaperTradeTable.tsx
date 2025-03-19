
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash } from 'lucide-react';
import { PaperTradeLeg } from '@/types/paper';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/dateParsingUtils';

interface PaperTradeTableProps {
  legs: PaperTradeLeg[];
  onAddLeg: () => void;
  onRemoveLeg: (id: string) => void;
  onEditLeg: (id: string) => void;
}

export const PaperTradeTable: React.FC<PaperTradeTableProps> = ({
  legs,
  onAddLeg,
  onRemoveLeg,
  onEditLeg
}) => {
  // Format number with thousands separator
  const formatNumber = (value: number): string => {
    return Math.round(value).toLocaleString('en-US');
  };
  
  // Format price to 2 decimal places
  const formatPrice = (value: number): string => {
    return value.toFixed(2);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAddLeg} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Leg
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Reference</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Buy/Sell</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {legs.map((leg) => (
              <TableRow key={leg.id}>
                <TableCell className="font-medium">{leg.legReference}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{leg.product}</span>
                    <span className="text-xs text-muted-foreground">{leg.instrument}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={leg.buySell === 'buy' ? 'default' : 'destructive'}>
                    {leg.buySell.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{formatNumber(leg.quantity)}</TableCell>
                <TableCell>
                  {leg.price ? (
                    formatPrice(leg.price)
                  ) : (
                    <span className="text-xs text-muted-foreground">Formula</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span>{formatDate(leg.pricingPeriodStart)} - </span>
                    <span>{formatDate(leg.pricingPeriodEnd)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditLeg(leg.id)}
                      className="h-8 w-8"
                    >
                      <span className="sr-only">Edit</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveLeg(leg.id)}
                      className="h-8 w-8 text-destructive"
                      disabled={legs.length <= 1}
                    >
                      <span className="sr-only">Remove</span>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaperTradeTable;
