
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
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';

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
  );
};

export default PaperTradeList;
