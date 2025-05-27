
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileDown } from 'lucide-react';
import { PhysicalTrade } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import TradeTableRow from '@/components/trades/physical/TradeTableRow';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { DateSortHeader } from '@/components/operations/DateSortHeader';
import { SortConfig, DateSortColumn } from '@/hooks/useMovementDateSort';
import { toast } from 'sonner';
import PaginationNav from '@/components/ui/pagination-nav';
import { PaginationMeta } from '@/types/pagination';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
  onExport?: () => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  sortColumns: SortConfig[];
  onSort: (column: DateSortColumn) => void;
}

const PhysicalTradeTable = ({ 
  trades, 
  loading, 
  error, 
  refetchTrades, 
  onExport,
  pagination,
  onPageChange,
  sortColumns,
  onSort
}: PhysicalTradeTableProps) => {
  if (loading) {
    return <TableLoadingState />;
  }
  
  if (error) {
    return (
      <TableErrorState
        error={error}
        onRetry={refetchTrades}
      />
    );
  }
  
  if (trades.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4">No trades found</p>
        <Link to="/trades/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Trade
          </Button>
        </Link>
      </div>
    );
  }
  
  // Create flattened rows for all trade legs
  const rows: JSX.Element[] = [];
  
  trades.forEach(trade => {
    const sortedLegs = [...trade.legs].sort((a, b) => {
      if (a.legReference === trade.tradeReference) return -1;
      if (b.legReference === trade.tradeReference) return 1;
      return a.legReference.localeCompare(b.legReference);
    });
    
    sortedLegs.forEach((leg, legIndex) => {
      rows.push(
        <TradeTableRow
          key={leg.id}
          trade={trade}
          leg={leg}
          legIndex={legIndex}
        />
      );
    });
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-white/10 overflow-hidden shadow-sm">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="min-w-[1800px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10">
                  <TableHead className="h-10 whitespace-nowrap">Reference</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Buy/Sell</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Incoterm</TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-right">Quantity</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Sustainability</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Product</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">
                    <DateSortHeader
                      column="loading_period_start"
                      label="Loading Start"
                      sortColumns={sortColumns}
                      onSort={onSort}
                    />
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap">
                    <DateSortHeader
                      column="loading_period_end"
                      label="Loading End"
                      sortColumns={sortColumns}
                      onSort={onSort}
                    />
                  </TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Counterparty</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Pricing Type</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Formula</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Comments</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Customs Status</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Contract Status</TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>
      
      {/* Pagination Controls */}
      {pagination && onPageChange && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing page {pagination.currentPage} of {pagination.totalPages}
            {pagination.totalItems > 0 && (
              <span> ({pagination.totalItems} total records)</span>
            )}
          </div>
          <PaginationNav 
            pagination={pagination}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default PhysicalTradeTable;
