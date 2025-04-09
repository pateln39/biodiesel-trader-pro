
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { PaperTrade } from '@/types/paper';
import { formatProductDisplay, calculateDisplayPrice } from '@/utils/productMapping';
import { exportPaperTradesToExcel } from '@/utils/excelExportUtils';
import { toast } from 'sonner';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import PaperTradeRowActions from '@/components/trades/paper/PaperTradeRowActions';

interface PaperTradeListProps {
  paperTrades: PaperTrade[];
  isLoading: boolean;
  error: Error | null;
  refetchPaperTrades: () => void;
}

const PaperTradeList: React.FC<PaperTradeListProps> = ({
  paperTrades,
  isLoading,
  error,
  refetchPaperTrades
}) => {
  const handleExport = async () => {
    try {
      toast.info("Exporting paper trades", { description: "Preparing Excel file..." });
      const fileName = await exportPaperTradesToExcel();
      toast.success("Export complete", { description: `Saved as ${fileName}` });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", { 
        description: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  };

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error} onRetry={refetchPaperTrades} />;
  }

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
            <TableHead>Reference</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Actions</TableHead>
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
                  <TableRow key={`${trade.id}-${leg.id}`} className="border-b border-white/5 hover:bg-brand-navy/80">
                    <TableCell>
                      <Link to={`/trades/paper/edit/${trade.id}`} className="text-white hover:text-white/80">
                        {displayReference}
                      </Link>
                    </TableCell>
                    <TableCell>{leg.broker || trade.broker}</TableCell>
                    <TableCell>{productDisplay}</TableCell>
                    <TableCell>{leg.period}</TableCell>
                    <TableCell className="text-right">{leg.quantity}</TableCell>
                    <TableCell className="text-right">{displayPrice}</TableCell>
                    <TableCell className="text-center">
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
  );
};

export default PaperTradeList;
