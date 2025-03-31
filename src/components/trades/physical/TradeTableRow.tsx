
import React from 'react';
import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import FormulaCellDisplay from './FormulaCellDisplay';
import TableRowActions from './TableRowActions';

interface TradeTableRowProps {
  trade: PhysicalTrade;
  leg: PhysicalTradeLeg;
  legIndex: number;
}

const TradeTableRow: React.FC<TradeTableRowProps> = ({
  trade,
  leg,
  legIndex,
}) => {
  const hasMultipleLegs = trade.legs && trade.legs.length > 1;
  
  // Use the dedicated pricing_type field instead of checking efpPremium
  const pricingType = leg.pricingType === 'efp' ? "EFP" : "Standard";
  
  return (
    <TableRow className={legIndex > 0 ? "border-t-0" : undefined}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
            {trade.physicalType === 'term' ? 
              `${trade.tradeReference}-${leg.legReference.split('-').pop()}` : 
              trade.tradeReference
            }
          </Link>
          {hasMultipleLegs && trade.physicalType === 'term' && (
            <Badge variant="outline" className="h-5 text-xs">
              <Link2 className="mr-1 h-3 w-3" />
              {legIndex === 0 ? "Primary" : `Leg ${legIndex + 1}`}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="capitalize">{leg.buySell}</TableCell>
      <TableCell>{leg.incoTerm}</TableCell>
      <TableCell className="text-right">{leg.quantity} {leg.unit}</TableCell>
      <TableCell>{leg.product}</TableCell>
      <TableCell>{trade.counterparty}</TableCell>
      <TableCell>{pricingType}</TableCell>
      <TableCell>
        <FormulaCellDisplay trade={leg} />
      </TableCell>
      <TableCell className="text-center">
        <TableRowActions
          tradeId={trade.id}
          legId={leg.id}
          isMultiLeg={hasMultipleLegs && trade.physicalType === 'term'}
          legReference={leg.legReference}
          tradeReference={trade.tradeReference}
        />
      </TableCell>
    </TableRow>
  );
};

export default TradeTableRow;
