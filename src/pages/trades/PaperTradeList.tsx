
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PaperTrade } from '@/types/paper';
import { formatProductDisplay, calculateDisplayPrice } from '@/utils/productMapping';
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
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error} onRetry={refetchPaperTrades} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
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
                <TableRow key={`${trade.id}-${leg.id}`}>
                  <TableCell>
                    <Link to={`/trades/paper/edit/${trade.id}`} className="text-primary hover:underline">
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
  );
};

export default PaperTradeList;
