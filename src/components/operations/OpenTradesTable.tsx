
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOpenTrades, OpenTrade } from '@/hooks/useOpenTrades';
import { formatDate } from '@/utils/dateUtils';
import { Loader2 } from 'lucide-react';

interface OpenTradesTableProps {
  onRefresh?: () => void;
}

const OpenTradesTable: React.FC<OpenTradesTableProps> = ({ onRefresh }) => {
  const { openTrades, loading, error, refetchOpenTrades } = useOpenTrades();

  const handleRefresh = () => {
    refetchOpenTrades();
    if (onRefresh) onRefresh();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading open trades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">Error loading open trades</p>
        <Button variant="outline" onClick={handleRefresh}>
          Try Again
        </Button>
      </div>
    );
  }

  if (openTrades.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">No open trades found</p>
        <Button variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/10">
            <TableHead>Trade Ref</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Open Qty</TableHead>
            <TableHead>Loading Period</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openTrades.map((trade) => (
            <TableRow key={trade.id} className="border-b border-white/5 hover:bg-brand-navy/80">
              <TableCell>
                <Link to={`/trades/${trade.parent_trade_id}`} className="hover:underline">
                  {trade.trade_reference}
                </Link>
              </TableCell>
              <TableCell>{trade.counterparty}</TableCell>
              <TableCell>
                {trade.product}
                {trade.sustainability && <span className="ml-2 text-sm text-muted-foreground">({trade.sustainability})</span>}
              </TableCell>
              <TableCell className="text-right">{trade.quantity} {trade.unit || 'MT'}</TableCell>
              <TableCell className="text-right">{Math.round(trade.open_quantity * 100) / 100} {trade.unit || 'MT'}</TableCell>
              <TableCell>
                {trade.loading_period_start && trade.loading_period_end ? (
                  `${formatDate(trade.loading_period_start)} - ${formatDate(trade.loading_period_end)}`
                ) : 'N/A'}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="sm">View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OpenTradesTable;
