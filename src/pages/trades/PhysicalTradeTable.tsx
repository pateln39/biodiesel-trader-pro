
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PhysicalTrade } from '@/types';
import { toast } from 'sonner';

import { useDeletionState } from '@/hooks/useDeletionState';
import DeleteConfirmationDialog from '@/components/trades/physical/DeleteConfirmationDialog';
import DeleteProgressIndicator from '@/components/trades/physical/DeleteProgressIndicator';
import TableLoadingState from '@/components/trades/physical/TableLoadingState';
import TableErrorState from '@/components/trades/physical/TableErrorState';
import TradeTableRow from '@/components/trades/physical/TradeTableRow';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
  realtimeChannelsRef?: React.MutableRefObject<{ [key: string]: any }>;
}

// Helper functions
const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const PhysicalTradeTable: React.FC<PhysicalTradeTableProps> = ({
  trades,
  loading,
  error,
  refetchTrades,
  realtimeChannelsRef
}) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  const isProcessingRef = useRef(false);
  
  // Use our deletion state hook
  const { 
    deletionContext, 
    openDeleteConfirmation, 
    cancelDelete, 
    confirmDelete, 
    resetDeletionState 
  } = useDeletionState({
    refetchTrades,
    realtimeChannelsRef
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only reset if not in the middle of an operation
      if (!deletionContext.isProcessing) {
        resetDeletionState();
      }
    };
  }, [resetDeletionState, deletionContext.isProcessing]);

  // Auto-reset success and error states after a delay
  useEffect(() => {
    if (deletionContext.state === 'success' || deletionContext.state === 'error') {
      const timer = setTimeout(() => {
        resetDeletionState();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [deletionContext.state, resetDeletionState]);

  // Comment handling logic
  const debouncedSaveComment = useCallback(
    debounce((tradeId: string, comment: string) => {
      setSavingComments(prev => ({ ...prev, [tradeId]: true }));
      
      setTimeout(() => {
        setSavingComments(prev => ({ ...prev, [tradeId]: false }));
      }, 500);
    }, 1000),
    []
  );

  const handleCommentChange = (tradeId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [tradeId]: comment
    }));
  };

  const handleCommentBlur = (tradeId: string) => {
    debouncedSaveComment(tradeId, comments[tradeId] || '');
  };

  const handleEditTrade = (tradeId: string) => {
    navigate(`/trades/${tradeId}`);
  };

  // Handler for deleting a trade - uses state machine
  const handleDeleteTrade = useCallback((tradeId: string, tradeReference: string) => {
    if (deletionContext.isProcessing) {
      return;
    }
    
    openDeleteConfirmation('trade', tradeId, tradeReference);
  }, [deletionContext.isProcessing, openDeleteConfirmation]);

  // Handler for deleting a leg - uses state machine
  const handleDeleteTradeLeg = useCallback((legId: string, legReference: string, parentId: string) => {
    if (deletionContext.isProcessing) {
      return;
    }
    
    openDeleteConfirmation('leg', legId, legReference, parentId);
  }, [deletionContext.isProcessing, openDeleteConfirmation]);

  if (loading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error} onRetry={refetchTrades} />;
  }

  // Determine if delete progress indicator should be shown
  const showProgressIndicator = deletionContext.state === 'deleting';

  // Share processing state with row actions
  isProcessingRef.current = deletionContext.isProcessing;

  return (
    <>
      {showProgressIndicator && (
        <DeleteProgressIndicator 
          isDeleting={true} 
          deletingId={deletionContext.itemId || ''} 
          progress={deletionContext.progress} 
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>INCO</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Price Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.length > 0 ? (
            trades.flatMap((trade) => {
              const legs = trade.legs || [];
              
              return legs.map((leg, legIndex) => (
                <TradeTableRow 
                  key={leg.id}
                  trade={trade}
                  leg={leg}
                  legIndex={legIndex}
                  comments={comments}
                  savingComments={savingComments}
                  isDeleting={deletionContext.state === 'deleting'}
                  deletingTradeId={deletionContext.itemId || ''}
                  isProcessingRef={isProcessingRef}
                  onCommentChange={handleCommentChange}
                  onCommentBlur={handleCommentBlur}
                  onEditTrade={handleEditTrade}
                  onDeleteTrade={handleDeleteTrade}
                  onDeleteTradeLeg={handleDeleteTradeLeg}
                />
              ));
            })
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                No physical trades found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DeleteConfirmationDialog
        isOpen={deletionContext.state === 'confirming'}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemType={deletionContext.itemType}
        itemReference={deletionContext.itemReference}
        isPerformingAction={deletionContext.isProcessing}
      />
    </>
  );
};

export default PhysicalTradeTable;
