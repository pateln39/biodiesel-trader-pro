
import React from 'react';
import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import FormulaCellDisplay from './FormulaCellDisplay';
import CommentField from './CommentField';
import TableRowActions from './TableRowActions';

interface TradeTableRowProps {
  trade: PhysicalTrade;
  leg: PhysicalTradeLeg;
  legIndex: number;
  comments: Record<string, string>;
  savingComments: Record<string, boolean>;
  isDeleting: boolean;
  deletingTradeId: string;
  isProcessingRef: React.MutableRefObject<boolean>;
  onCommentChange: (id: string, comment: string) => void;
  onCommentBlur: (id: string) => void;
  onEditTrade: (id: string) => void;
  onDeleteTrade: (id: string, reference: string) => void;
  onDeleteTradeLeg: (legId: string, legReference: string, parentId: string) => void;
}

const TradeTableRow: React.FC<TradeTableRowProps> = ({
  trade,
  leg,
  legIndex,
  comments,
  savingComments,
  isDeleting,
  deletingTradeId,
  isProcessingRef,
  onCommentChange,
  onCommentBlur,
  onEditTrade,
  onDeleteTrade,
  onDeleteTradeLeg,
}) => {
  const hasMultipleLegs = trade.legs && trade.legs.length > 1;
  
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
      <TableCell>
        <FormulaCellDisplay trade={leg} />
      </TableCell>
      <TableCell>
        <CommentField
          id={leg.id}
          value={comments[leg.id] || ''}
          onChange={onCommentChange}
          onBlur={onCommentBlur}
          isSaving={savingComments[leg.id] || false}
        />
      </TableCell>
      <TableCell className="text-center">
        <TableRowActions
          tradeId={trade.id}
          legId={leg.id}
          isMultiLeg={hasMultipleLegs && trade.physicalType === 'term'}
          legReference={leg.legReference}
          tradeReference={trade.tradeReference}
          isDeleting={isDeleting}
          deletingId={deletingTradeId}
          isProcessing={isProcessingRef.current}
          onEdit={onEditTrade}
          onDeleteTrade={onDeleteTrade}
          onDeleteLeg={onDeleteTradeLeg}
        />
      </TableCell>
    </TableRow>
  );
};

export default TradeTableRow;
