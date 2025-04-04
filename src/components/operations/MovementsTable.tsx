
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
    // We need to adjust the query to use the trade_legs table and join with movements
    // since the Supabase client isn't recognizing the movements table directly
    const { data: movements, error } = await supabase
      .from('trade_legs')
      .select(`
        id,
        parent_trade_id,
        leg_reference,
        buy_sell,
        product,
        movements (
          id,
          bl_quantity,
          created_at,
          updated_at
        ),
        parent_trades!parent_trade_id (
          id,
          trade_reference,
          counterparty
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    // Map the data into a format that matches our Movement interface
    const flattenedMovements = movements
      .filter(m => m.movements && m.movements.length > 0)
      .flatMap(leg => {
        return leg.movements.map((movement: any) => {
          return {
            id: movement.id,
            parentTradeId: leg.parent_trade_id || '',
            tradeReference: leg.parent_trades?.trade_reference || leg.leg_reference || 'Unknown',
            counterpartyName: leg.parent_trades?.counterparty || 'Unknown',
            product: leg.product || 'Unknown',
            quantity: movement.bl_quantity,
            date: new Date(movement.created_at),
            status: 'Completed',
            type: leg.buy_sell === 'buy' ? 'In' : 'Out',
          };
        });
      });

    return flattenedMovements;
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
