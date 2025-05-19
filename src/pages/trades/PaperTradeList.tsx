
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaperTrade } from '@/types/paper';
import { formatProductDisplay, calculateDisplayPrice } from '@/utils/productMapping';
import { toast } from 'sonner';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import PaperTradeRowActions from '@/components/trades/paper/PaperTradeRowActions';
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';
import PaginationNav from '@/components/ui/pagination-nav';
import { PaginationMeta } from '@/types/pagination';

// Constants for cell width to maintain consistency
const CELL_WIDTHS = {
  reference: 140,
  broker: 150,
  product: 180, 
  period: 100,
  quantity: 100,
  price: 100,
  actions: 100
};

interface PaperTradeListProps {
  paperTrades: PaperTrade[];
  isLoading: boolean;
  error: Error | null;
  refetchPaperTrades: () => void;
  onExport?: () => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

const PaperTradeList: React.FC<PaperTradeListProps> = ({
  paperTrades,
  isLoading,
  error,
  refetchPaperTrades,
  onExport,
  pagination,
  onPageChange
}) => {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error} onRetry={refetchPaperTrades} />;
  }

  // Count the total number of legs across all trades for info display
  const totalLegs = paperTrades.reduce((acc, trade) => acc + trade.legs.length, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-white/10 overflow-hidden shadow-sm">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10">
                  <TableHead className="h-10 whitespace-nowrap">Reference</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Broker</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Products</TableHead>
                  <TableHead className="h-10 whitespace-nowrap">Period</TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-right">Quantity</TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-right">Price</TableHead>
                  <TableHead className="h-10 whitespace-nowrap text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paperTrades && paperTrades.length > 0 ? (
                  paperTrades.flatMap((trade) => {
                    return trade.legs.map((leg, legIndex) => {
                      let productDisplay = formatProductDisplay(
                        leg.product,
                        leg.relationshipType,
                        leg.rightSide?.product
                      );
                      
                      const displayReference = `${trade.tradeReference}${legIndex > 0 ? `-${String.fromCharCode(97 + legIndex)}` : '-a'}`;
                      const isMultiLeg = trade.legs.length > 1;
                      
                      // Calculate the display price based on relationship type
                      const displayPrice = calculateDisplayPrice(
                        leg.relationshipType,
                        leg.price,
                        leg.rightSide?.price
                      );
                      
                      return (
                        <TableRow key={`${trade.id}-${leg.id}`} className="border-b border-white/5 hover:bg-brand-navy/80 h-10">
                          <TableCell className="h-10">
                            <TruncatedCell 
                              text={displayReference} 
                              width={CELL_WIDTHS.reference} 
                              className="text-xs font-medium text-white hover:text-white/80"
                            />
                          </TableCell>
                          <TableCell className="h-10">
                            <TruncatedCell 
                              text={leg.broker || trade.broker} 
                              width={CELL_WIDTHS.broker}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell className="h-10">
                            <TruncatedCell 
                              text={productDisplay} 
                              width={CELL_WIDTHS.product}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell className="h-10 whitespace-nowrap">{leg.period}</TableCell>
                          <TableCell className="h-10 text-right whitespace-nowrap">{leg.quantity}</TableCell>
                          <TableCell className="h-10 text-right whitespace-nowrap">{displayPrice}</TableCell>
                          <TableCell className="h-10 text-center">
                            <PaperTradeRowActions
                              tradeId={trade.id}
                              legId={leg.id}
                              isMultiLeg={isMultiLeg}
                              legReference={leg.legReference}
                              tradeReference={trade.tradeReference}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No paper trades found.
                    </TableCell>
                  </TableRow>
                )}
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
              <span> ({pagination.totalItems} total legs)</span>
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

export default PaperTradeList;
