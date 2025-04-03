
import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/dateUtils';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types/physical';
import FormulaCellDisplay from './FormulaCellDisplay';
import CommentsCellInput from './CommentsCellInput';
import TableRowActions from './TableRowActions';
import ContractStatusSelect from './ContractStatusSelect';

interface TradeTableRowProps {
  trade: PhysicalTrade;
  leg: PhysicalTradeLeg;
  legIndex: number;
}

const TradeTableRow = ({ trade, leg, legIndex }: TradeTableRowProps) => {
  const navigate = useNavigate();
  
  // Generate visual representation of the leg/trade reference
  const isMainLeg = leg.legReference === trade.tradeReference;
  const displayReference = isMainLeg 
    ? trade.tradeReference 
    : `${trade.tradeReference}-${String.fromCharCode(97 + legIndex)}`;

  return (
    <TableRow 
      key={leg.id} 
      className="border-b border-white/5 hover:bg-brand-navy/80"
    >
      <TableCell>
        <Link 
          to={`/trades/edit/${trade.id}`} 
          className="text-white hover:text-white/80 font-medium"
        >
          {displayReference}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={leg.buySell === 'buy' ? "default" : "outline"}>
          {leg.buySell}
        </Badge>
      </TableCell>
      <TableCell>{leg.incoTerm}</TableCell>
      <TableCell className="text-right">{leg.quantity} {leg.unit}</TableCell>
      <TableCell>{leg.sustainability}</TableCell>
      <TableCell>{leg.product}</TableCell>
      <TableCell>{formatDate(leg.loadingPeriodStart)}</TableCell>
      <TableCell>{formatDate(leg.loadingPeriodEnd)}</TableCell>
      <TableCell>{trade.counterparty}</TableCell>
      <TableCell>{leg.pricingType === 'efp' ? 'EFP' : 'Standard'}</TableCell>
      <TableCell>
        <FormulaCellDisplay 
          tradeId={trade.id}
          legId={leg.id}
          formula={leg.formula}
          pricingType={leg.pricingType}
          efpPremium={leg.efpPremium}
          efpDesignatedMonth={leg.efpDesignatedMonth}
          efpAgreedStatus={leg.efpAgreedStatus}
          efpFixedValue={leg.efpFixedValue}
        />
      </TableCell>
      <TableCell>
        <CommentsCellInput 
          tradeId={trade.id}
          legId={leg.id}
          initialValue={leg.comments || ''}
        />
      </TableCell>
      <TableCell>
        <Badge variant={
          leg.productCreditStatus === 'approved' ? "default" :
          leg.productCreditStatus === 'rejected' ? "destructive" :
          "outline"
        }>
          {leg.productCreditStatus || 'pending'}
        </Badge>
      </TableCell>
      <TableCell>
        <ContractStatusSelect
          tradeId={trade.id}
          legId={leg.id} 
          initialValue={leg.contractStatus}
        />
      </TableCell>
      <TableCell className="text-center">
        <TableRowActions 
          tradeId={trade.id} 
          legId={leg.id}
          isMultiLeg={trade.legs.length > 1}
          tradeReference={trade.tradeReference}
          legReference={leg.legReference}
        />
      </TableCell>
    </TableRow>
  );
};

export default TradeTableRow;
