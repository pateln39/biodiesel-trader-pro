
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { Badge } from '@/components/ui/badge';

const fetchMovements = async (): Promise<Movement[]> => {
  try {
    // Directly query the movements table
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    return (movements || []).map((m: any) => ({
      id: m.id,
      referenceNumber: m.reference_number,
      tradeLegId: m.trade_leg_id,
      parentTradeId: m.parent_trade_id,
      tradeReference: m.trade_reference || 'Unknown',
      counterpartyName: m.counterparty || 'Unknown',
      product: m.product || 'Unknown',
      buySell: m.buy_sell,
      incoTerm: m.inco_term,
      sustainability: m.sustainability,
      scheduledQuantity: m.scheduled_quantity,
      blQuantity: m.bl_quantity,
      actualQuantity: m.actual_quantity,
      nominationEta: m.nomination_eta ? new Date(m.nomination_eta) : undefined,
      nominationValid: m.nomination_valid ? new Date(m.nomination_valid) : undefined,
      cashFlow: m.cash_flow,
      bargeName: m.barge_name,
      loadport: m.loadport,
      loadportInspector: m.loadport_inspector,
      disport: m.disport,
      disportInspector: m.disport_inspector,
      blDate: m.bl_date ? new Date(m.bl_date) : undefined,
      codDate: m.cod_date ? new Date(m.cod_date) : undefined,
      pricingType: m.pricing_type,
      pricingFormula: m.pricing_formula,
      comments: m.comments,
      customsStatus: m.customs_status,
      creditStatus: m.credit_status,
      contractStatus: m.contract_status,
      status: m.status || 'scheduled',
      date: new Date(m.created_at),
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }));
  } catch (error: any) {
    console.error('[MOVEMENTS] Error fetching movements:', error);
    throw new Error(error.message);
  }
};

const MovementsTable = () => {
  const { data: movements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference Number</TableHead>
            <TableHead>Trade Reference</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Scheduled Quantity</TableHead>
            <TableHead>BL Quantity</TableHead>
            <TableHead>Actual Quantity</TableHead>
            <TableHead>Nomination ETA</TableHead>
            <TableHead>Barge Name</TableHead>
            <TableHead>Loadport</TableHead>
            <TableHead>Disport</TableHead>
            <TableHead>BL Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="h-24 text-center">
                No movements found
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{movement.referenceNumber}</TableCell>
                <TableCell>{movement.tradeReference}</TableCell>
                <TableCell>{movement.counterpartyName}</TableCell>
                <TableCell>
                  <Badge variant={movement.buySell === 'buy' ? "default" : "outline"}>
                    {movement.buySell}
                  </Badge>
                </TableCell>
                <TableCell>{movement.product}</TableCell>
                <TableCell>{movement.scheduledQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.blQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.actualQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.bargeName || '-'}</TableCell>
                <TableCell>{movement.loadport || '-'}</TableCell>
                <TableCell>{movement.disport || '-'}</TableCell>
                <TableCell>{movement.blDate ? format(movement.blDate, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>
                  <Badge variant={
                    movement.status === 'completed' ? "default" :
                    movement.status === 'cancelled' ? "destructive" :
                    "outline"
                  }>
                    {movement.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MovementsTable;
