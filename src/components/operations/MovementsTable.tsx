
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

const fetchMovements = async (): Promise<Movement[]> => {
  try {
    // Directly query the movements table
    const { data: movements, error } = await supabase
      .from('movements')
      .select(`
        id,
        trade_leg_id,
        bl_quantity,
        created_at,
        updated_at,
        trade_legs:trade_leg_id (
          id,
          parent_trade_id,
          buy_sell,
          product,
          parent_trades:parent_trade_id (
            trade_reference,
            counterparty
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    // Map the data into a format that matches our Movement interface
    const formattedMovements = (movements || []).map((m: any) => {
      return {
        id: m.id,
        parentTradeId: m.trade_legs?.parent_trade_id || '',
        tradeReference: m.trade_legs?.parent_trades?.trade_reference || 'Unknown',
        counterpartyName: m.trade_legs?.parent_trades?.counterparty || 'Unknown',
        product: m.trade_legs?.product || 'Unknown',
        quantity: m.bl_quantity,
        date: new Date(m.created_at),
        status: 'Completed',
        type: m.trade_legs?.buy_sell === 'buy' ? 'In' : 'Out',
      };
    });

    return formattedMovements;
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
            <TableHead>Trade Reference</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No movements found
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{movement.tradeReference}</TableCell>
                <TableCell>{movement.counterpartyName}</TableCell>
                <TableCell>{movement.product}</TableCell>
                <TableCell>{movement.quantity.toLocaleString()} MT</TableCell>
                <TableCell>{format(movement.date, 'dd MMM yyyy')}</TableCell>
                <TableCell>{movement.type}</TableCell>
                <TableCell>{movement.status}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MovementsTable;
