
import React, { useState, useEffect } from 'react';
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
import { SortableTable } from '@/components/ui/sortable-table';
import { supabase } from '@/integrations/supabase/client';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
}

const PhysicalTradeTable = ({ trades, loading, error, refetchTrades }: PhysicalTradeTableProps) => {
  const navigate = useNavigate();
  const [userTradeOrder, setUserTradeOrder] = useState<string[]>([]);

  // Load user's preferred order when component mounts
  useEffect(() => {
    const loadUserTradeOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('physical_trade_order')
          .single();
          
        if (error) {
          console.error('Error loading trade order:', error);
          return;
        }
        
        if (data?.physical_trade_order) {
          setUserTradeOrder(data.physical_trade_order);
        }
      } catch (err) {
        console.error('Failed to load trade order:', err);
      }
    };
    
    loadUserTradeOrder();
  }, []);

  // Sort trades based on user preference if available
  const sortedTrades = [...trades].sort((a, b) => {
    if (userTradeOrder.length === 0) {
      // Default sorting - newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    const aIndex = userTradeOrder.indexOf(a.id);
    const bIndex = userTradeOrder.indexOf(b.id);
    
    // If both trades are in the saved order, use that
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one trade is in the saved order, put it first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // For trades not in the saved order, default to newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Save user's preferred order
  const handleOrderChange = async (newTrades: PhysicalTrade[]) => {
    const newOrder = newTrades.map(trade => trade.id);
    setUserTradeOrder(newOrder);
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          physical_trade_order: newOrder,
          id: 'physical-trade-order' // Use a fixed ID for simplicity
        }, { onConflict: 'id' });
        
      if (error) {
        console.error('Error saving trade order:', error);
      }
    } catch (err) {
      console.error('Failed to save trade order:', err);
    }
  };

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
  
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>Incoterm</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Sustainability</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Loading Start</TableHead>
            <TableHead>Loading End</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Product Credit</TableHead>
            <TableHead>Contract Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <SortableTable
          items={sortedTrades}
          getItemId={(trade) => trade.id}
          onOrderChange={handleOrderChange}
        >
          {(sortedItems, { dragHandleProps }) => (
            <TableBody>
              {sortedItems.map(trade => {
                const sortedLegs = [...trade.legs].sort((a, b) => {
                  if (a.legReference === trade.tradeReference) return -1;
                  if (b.legReference === trade.tradeReference) return 1;
                  return a.legReference.localeCompare(b.legReference);
                });
                
                return sortedLegs.map((leg, legIndex) => (
                  <TradeTableRow
                    key={leg.id}
                    trade={trade}
                    leg={leg}
                    legIndex={legIndex}
                    dragHandleProps={legIndex === 0 ? dragHandleProps(trade.id) : undefined}
                  />
                ));
              })}
            </TableBody>
          )}
        </SortableTable>
      </Table>
    </div>
  );
};

export default PhysicalTradeTable;
