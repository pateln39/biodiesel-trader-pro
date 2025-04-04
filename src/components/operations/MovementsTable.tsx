
import React, { useState } from 'react';
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
import TableLoadingState from '@/components/trades/physical/TableLoadingState';
import TableErrorState from '@/components/trades/physical/TableErrorState';

const fetchMovements = async (): Promise<Movement[]> => {
  try {
    const { data: movements, error } = await supabase
      .from('movements')
      .select(`
        id,
        bl_quantity,
        created_at,
        updated_at,
        trade_legs(
          id,
          parent_trade_id,
          leg_reference,
          buy_sell,
          product,
          quantity
        ),
        parent_trades(
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
    return movements.map((m: any) => {
      const tradeLeg = m.trade_legs;
      const parentTrade = m.parent_trades;
      
      return {
        id: m.id,
        parentTradeId: tradeLeg?.parent_trade_id || '',
        tradeReference: parentTrade?.trade_reference || tradeLeg?.leg_reference || 'Unknown',
        counterpartyName: parentTrade?.counterparty || 'Unknown',
        product: tradeLeg?.product || 'Unknown',
        quantity: m.bl_quantity,
        date: new Date(m.created_at),
        status: 'Completed',
        type: tradeLeg?.buy_sell === 'buy' ? 'In' : 'Out',
      };
    });
  } catch (error: any) {
    console.error('[MOVEMENTS] Error fetching movements:', error);
    throw new Error(error.message);
  }
};

const MovementsTable = () => {
  const { data: movements = [], isLoading, error } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error as Error} />;
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
