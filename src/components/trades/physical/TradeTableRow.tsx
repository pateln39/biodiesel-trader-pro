
import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types/physical';
import FormulaCellDisplay from './FormulaCellDisplay';
import CommentsCellInput from './CommentsCellInput';
import TableRowActions from './TableRowActions';
import ContractStatusSelect from './ContractStatusSelect';
import ProductToken from '@/components/operations/storage/ProductToken';
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';

// Constants for cell width to maintain consistency
const CELL_WIDTHS = {
  reference: 140,
  counterparty: 150,
  incoTerm: 80,
  quantity: 100,
  product: 120,
  date: 110,
  comments: 80,
  formula: 150,
  actions: 100
};

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
      className="border-b border-white/5 hover:bg-brand-navy/80 h-10"
    >
      <TableCell className="h-10">
        <TruncatedCell 
          text={displayReference} 
          width={CELL_WIDTHS.reference} 
          className="text-xs font-medium text-white hover:text-white/80"
        />
      </TableCell>
      <TableCell className="h-10">
        <Badge variant={leg.buySell === 'buy' ? "default" : "outline"}>
          {leg.buySell}
        </Badge>
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">{leg.incoTerm}</TableCell>
      <TableCell className="h-10 text-right whitespace-nowrap">{leg.quantity} {leg.unit}</TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        <TruncatedCell 
          text={leg.sustainability || '-'} 
          width={CELL_WIDTHS.product} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <ProductToken 
          product={leg.product}
          value={leg.product}
          showTooltip={true}
        />
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">{formatDate(leg.loadingPeriodStart)}</TableCell>
      <TableCell className="h-10 whitespace-nowrap">{formatDate(leg.loadingPeriodEnd)}</TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={trade.counterparty} 
          width={CELL_WIDTHS.counterparty} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">{leg.pricingType === 'efp' ? 'EFP' : 'Standard'}</TableCell>
      <TableCell className="h-10">
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
      <TableCell className="h-10">
        <CommentsCellInput 
          tradeId={trade.id}
          legId={leg.id}
          initialValue={leg.comments || ''}
          useInlineIcon={true}
        />
      </TableCell>
      <TableCell className="h-10">
        <Badge variant={
          leg.customsStatus === 'approved' ? "default" :
          leg.customsStatus === 'rejected' ? "destructive" :
          "outline"
        }>
          {leg.customsStatus || 'pending'}
        </Badge>
      </TableCell>
      <TableCell className="h-10">
        <ContractStatusSelect
          tradeId={trade.id}
          legId={leg.id} 
          initialValue={leg.contractStatus}
        />
      </TableCell>
      <TableCell className="text-center h-10">
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
