
import React, { useEffect } from 'react';
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
import { formatDate } from '@/utils/dateUtils';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
  onDataChange?: (data: any[]) => void;
}

const PhysicalTradeTable = ({ 
  trades, 
  loading, 
  error, 
  refetchTrades,
  onDataChange
}: PhysicalTradeTableProps) => {
  const navigate = useNavigate();

  // Prepare data for export
  useEffect(() => {
    if (trades.length > 0 && onDataChange) {
      const exportData: any[] = [];
      
      trades.forEach(trade => {
        const sortedLegs = [...trade.legs].sort((a, b) => {
          if (a.legReference === trade.tradeReference) return -1;
          if (b.legReference === trade.tradeReference) return 1;
          return a.legReference.localeCompare(b.legReference);
        });
        
        sortedLegs.forEach(leg => {
          // Format formula for display in export
          let formulaDisplay = '';
          if (leg.formula) {
            try {
              formulaDisplay = JSON.stringify(leg.formula);
            } catch (e) {
              formulaDisplay = 'Complex Formula';
            }
          }
          
          exportData.push({
            reference: leg.legReference === trade.tradeReference ? 
              trade.tradeReference : 
              `${trade.tradeReference}-${leg.legReference.split('-').pop()}`,
            buySell: leg.buySell,
            incoTerm: leg.incoTerm || '',
            quantity: `${leg.quantity} ${leg.unit || 'MT'}`,
            sustainability: leg.sustainability || '',
            product: leg.product,
            loadingStart: leg.loadingPeriodStart ? formatDate(leg.loadingPeriodStart) : '',
            loadingEnd: leg.loadingPeriodEnd ? formatDate(leg.loadingPeriodEnd) : '',
            counterparty: trade.counterparty,
            pricingType: leg.pricingType === 'efp' ? 'EFP' : 'Standard',
            formula: formulaDisplay,
            comments: leg.comments || '',
            customsStatus: leg.customsStatus || '',
            contractStatus: leg.contractStatus || ''
          });
        });
      });
      
      onDataChange(exportData);
    }
  }, [trades, onDataChange]);

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
            <TableHead>Pricing Type</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Customs Status</TableHead>
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
