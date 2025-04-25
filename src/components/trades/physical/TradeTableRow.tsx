import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formatDate } from '@/utils/dateUtils';
import ProductToken from '@/components/operations/storage/ProductToken';

interface TradeTableRowProps {
  trade: PhysicalTrade;
  leg: PhysicalTradeLeg;
  legIndex: number;
}

const TradeTableRow = ({ trade, leg, legIndex }: TradeTableRowProps) => {
  return (
    <TableRow className="border-b border-white/5 hover:bg-brand-navy/80">
      <TableCell>
        <Link to={`/trades/edit/${trade.id}`} className="text-white hover:text-white/80">
          {trade.physicalType === 'term' ? (
            <>
              {trade.tradeReference}-{leg.legReference.split('-').pop()}
            </>
          ) : (
            <>
              {trade.tradeReference}
            </>
          )}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={leg.buySell === 'buy' ? "default" : "outline"}>
          {leg.buySell.charAt(0).toUpperCase() + leg.buySell.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>{trade.incoTerm}</TableCell>
      <TableCell className="text-right">{leg.quantity.toLocaleString()} MT</TableCell>
      <TableCell>{trade.sustainability}</TableCell>
      <TableCell>
        <ProductToken product={leg.product} size="md" />
      </TableCell>
      <TableCell>{formatDate(leg.loadingPeriodStart)}</TableCell>
      <TableCell>{formatDate(leg.loadingPeriodEnd)}</TableCell>
      <TableCell>{trade.counterparty}</TableCell>
      <TableCell>{leg.pricingType}</TableCell>
      <TableCell>{leg.formula?.formula}</TableCell>
      <TableCell>{leg.comments}</TableCell>
      <TableCell>{trade.customsStatus}</TableCell>
      <TableCell>{trade.contractStatus}</TableCell>
      <TableCell className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link to={`/trades/edit/${trade.id}`} className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </Link>
            </DropdownMenuItem>
            {trade.legs.length > 1 ? (
              <DropdownMenuItem>
                <Link to={`/trades/delete/${trade.id}/leg/${leg.id}`} className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Leg</span>
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <Link to={`/trades/delete/${trade.id}`} className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Trade</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default TradeTableRow;
