
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PaperTrade } from '@/types/paper';
import { formatProductDisplay, calculateDisplayPrice } from '@/utils/productMapping';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import PaperTradeRowActions from '@/components/trades/paper/PaperTradeRowActions';
import { SortableTable } from '@/components/ui/sortable-table';
import { SortableTableRow } from '@/components/ui/sortable-table-row';
import { supabase } from '@/integrations/supabase/client';

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
  const [userTradeOrder, setUserTradeOrder] = useState<string[]>([]);

  // Load user's preferred order when component mounts
  useEffect(() => {
    const loadUserTradeOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('paper_trade_order')
          .single();
          
        if (error) {
          console.error('Error loading trade order:', error);
          return;
        }
        
        if (data?.paper_trade_order) {
          setUserTradeOrder(data.paper_trade_order);
        }
      } catch (err) {
        console.error('Failed to load trade order:', err);
      }
    };
    
    loadUserTradeOrder();
  }, []);

  // Sort trades based on user preference if available
  const sortedTrades = [...paperTrades].sort((a, b) => {
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
  const handleOrderChange = async (newTrades: PaperTrade[]) => {
    const newOrder = newTrades.map(trade => trade.id);
    setUserTradeOrder(newOrder);
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          paper_trade_order: newOrder,
          id: 'paper-trade-order' // Use a fixed ID for simplicity
        }, { onConflict: 'id' });
        
      if (error) {
        console.error('Error saving trade order:', error);
      }
    } catch (err) {
      console.error('Failed to save trade order:', err);
    }
  };

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error} onRetry={refetchPaperTrades} />;
  }

  // Create a mapping of trades by ID for sortable component
  const processedTrades = sortedTrades.flatMap((trade) => {
    return trade.legs.map((leg, legIndex) => ({
      trade,
      leg,
      legIndex,
      id: `${trade.id}-${leg.id}`,
      parentId: trade.id
    }));
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Broker</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Period</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      {paperTrades && paperTrades.length > 0 ? (
        <SortableTable
          items={sortedTrades}
          getItemId={(trade) => trade.id}
          onOrderChange={handleOrderChange}
        >
          {(sortedItems, { dragHandleProps }) => (
            <TableBody>
              {sortedItems.flatMap((trade) => {
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
                    <SortableTableRow key={`${trade.id}-${leg.id}`} id={trade.id}>
                      {/* Drag Handle */}
                      <TableCell className="w-8">
                        {legIndex === 0 && (
                          <div {...dragHandleProps(trade.id)} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Link to={`/trades/paper/edit/${trade.id}`} className="text-white hover:text-white/80">
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
                    </SortableTableRow>
                  );
                });
              })}
            </TableBody>
          )}
        </SortableTable>
      ) : (
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
              No paper trades found.
            </TableCell>
          </TableRow>
        </TableBody>
      )}
    </Table>
  );
};

export default PaperTradeList;
