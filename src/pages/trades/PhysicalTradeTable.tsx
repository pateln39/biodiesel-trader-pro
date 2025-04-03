
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
import TradeTableRow from '@/components/trades/physical/TradeTableRow';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
}

const PhysicalTradeTable = ({ trades, loading, error, refetchTrades }: PhysicalTradeTableProps) => {
  const navigate = useNavigate();

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
    <div className="rounded-md border overflow-x-auto bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/10">
            <TableHead>Reference</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>Incoterm</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Sustainability</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Loading Start</TableHead>
            <TableHead>Loading End</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Product Credit</TableHead>
            <TableHead>Contract Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
    </div>
  );
};

export default PhysicalTradeTable;
