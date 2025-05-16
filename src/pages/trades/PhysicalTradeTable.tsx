import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PhysicalTrade } from '@/types';
import { formatDate, formatNumber } from '@/lib/formatters';
import { PaginationMeta } from '@/types/pagination';
import PaginationNav from '@/components/ui/pagination-nav';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
  pagination: PaginationMeta;
  onPageChange?: (page: number) => void;
}

const PhysicalTradeTable: React.FC<PhysicalTradeTableProps> = ({
  trades,
  loading,
  error,
  refetchTrades,
  pagination,
  onPageChange,
}) => {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={refetchTrades}>
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const renderSkeletonRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      </TableRow>
    ));
  };

  const getBuySellBadge = (buySell: 'buy' | 'sell') => {
    return buySell === 'buy' 
      ? <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Buy</Badge>
      : <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Sell</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Draft</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Loading Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No trades found.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.tradeReference}</TableCell>
                  <TableCell>{trade.counterparty}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{trade.product}</span>
                      <span className="text-xs text-muted-foreground">{getBuySellBadge(trade.buySell)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatNumber(trade.quantity)} {trade.unit}</TableCell>
                  <TableCell>{trade.physicalType === 'spot' ? 'Spot' : 'Term'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(trade.loadingPeriodStart)}</span>
                      {trade.loadingPeriodEnd && trade.loadingPeriodEnd.getTime() !== trade.loadingPeriodStart.getTime() && (
                        <span className="text-xs text-muted-foreground">to {formatDate(trade.loadingPeriodEnd)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(trade.contractStatus)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/trades/${trade.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/trades/${trade.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <div className="mt-4">
          <PaginationNav 
            pagination={pagination}
            className="justify-end"
          />
        </div>
      )}
    </div>
  );
};

export default PhysicalTradeTable;
