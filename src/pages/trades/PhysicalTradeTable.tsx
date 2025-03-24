import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
}

const PhysicalTradeTable = ({ trades, loading, error, refetchTrades }: PhysicalTradeTableProps) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  
  // Initialize comments from trades
  useEffect(() => {
    const initialComments: Record<string, string> = {};
    
    trades.forEach(trade => {
      trade.legs.forEach(leg => {
        if (leg.id) {
          initialComments[leg.id] = leg.comment || '';
        }
      });
    });
    
    setComments(initialComments);
  }, [trades]);
  
  // Handle comment change
  const handleCommentChange = (id: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [id]: comment
    }));
  };
  
  // Handle comment save on blur
  const handleCommentBlur = async (id: string) => {
    // Don't save if unchanged
    const leg = trades.flatMap(t => t.legs).find(l => l.id === id);
    if (!leg || leg.comment === comments[id]) {
      return;
    }
    
    // Mark as saving
    setSavingComments(prev => ({
      ...prev,
      [id]: true
    }));
    
    try {
      const { error } = await supabase
        .from('trade_legs')
        .update({ comment: comments[id] })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      toast.error('Failed to save comment');
    } finally {
      setSavingComments(prev => ({
        ...prev,
        [id]: false
      }));
    }
  };

  const handleEditTrade = (tradeId: string) => {
    navigate(`/trades/edit/${tradeId}`);
  };

  // Show loading state
  if (loading) {
    return <TableLoadingState />;
  }
  
  // Show error state
  if (error) {
    return (
      <TableErrorState
        error={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetchTrades}
      />
    );
  }
  
  // Show empty state
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
  
  // Group trades by trade reference for display
  const rows: JSX.Element[] = [];
  
  trades.forEach(trade => {
    // Sort legs to ensure consistent display
    const sortedLegs = [...trade.legs].sort((a, b) => {
      // Primary leg first, then by legReference
      if (a.legReference === trade.tradeReference) return -1;
      if (b.legReference === trade.tradeReference) return 1;
      return a.legReference.localeCompare(b.legReference);
    });
    
    sortedLegs.forEach((leg, legIndex) => {
      rows.push(
        <TradeTableRow
          key={leg.id}
          trade={trade}
          leg={leg}
          legIndex={legIndex}
          comments={comments}
          savingComments={savingComments}
          onCommentChange={handleCommentChange}
          onCommentBlur={handleCommentBlur}
        />
      );
    });
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>Incoterm</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
    </div>
  );
};

export default PhysicalTradeTable;
