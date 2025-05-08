
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import TradeTableRow from '@/components/trades/physical/TradeTableRow';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { exportPhysicalTradesToExcel } from '@/utils/excelExportUtils';
import { toast } from 'sonner';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
}

const PhysicalTradeTable = ({ trades, loading, error, refetchTrades }: PhysicalTradeTableProps) => {
  const navigate = useNavigate();

  const handleExport = async () => {
    try {
      toast.info("Exporting trades", { description: "Preparing Excel file..." });
      const fileName = await exportPhysicalTradesToExcel();
      toast.success("Export complete", { description: `Saved as ${fileName}` });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", { 
        description: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  };

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
    <div className="rounded-md border border-white/10 overflow-hidden shadow-sm">
      <div className="flex justify-end p-2 bg-muted/30 border-b border-white/10">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" /> Export to Excel
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/10">
            <TableHead className="h-10 whitespace-nowrap">Reference</TableHead>
            <TableHead className="h-10 whitespace-nowrap">Buy/Sell</TableHead>
            <TableHead className="h-10 whitespace-nowrap">Incoterm</TableHead>
            <TableHead className="h-10 whitespace-nowrap text-right">Quantity</TableHead>
            <TableHead className="h-10 whitespace-nowrap">Sustainability</TableHead>
            <TableHead className="h-10 whitespace-nowrap">Product</TableHead>
            <TableHead className="h-10 whitespace-nowrap">Loading Start</TableHead>
            <TableHead className="h-10 whitespace-nowrap">Loading End</TableHead>
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
  );
};

export default PhysicalTradeTable;
