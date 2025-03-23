import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PhysicalTrade } from '@/types';
import { deletePhysicalTrade, deletePhysicalTradeLeg } from '@/utils/physicalTradeDeleteUtils';
import { pausePhysicalSubscriptions, resumePhysicalSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';
import { toast } from 'sonner';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTradeId, setDeletingTradeId] = useState<string>('');
  const [deletionProgress, setDeletionProgress] = useState(0);
  const isProcessingRef = useRef(false);
  
  // Dialog related state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'trade' | 'leg'>('trade');
  const [itemToDeleteId, setItemToDeleteId] = useState<string>('');
  const [itemToDeleteReference, setItemToDeleteReference] = useState<string>('');
  const [parentTradeId, setParentTradeId] = useState<string>('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Cleanup timer ref
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect to ensure cleanup of any lingering states
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      // Ensure we resume subscriptions if component unmounts during an operation
      if (realtimeChannelsRef && isProcessingRef.current) {
        resumePhysicalSubscriptions(realtimeChannelsRef.current);
        isProcessingRef.current = false;
      }
    };
  }, [realtimeChannelsRef]);

  const debouncedSaveComment = useCallback(
    debounce((tradeId: string, comment: string) => {
      setSavingComments(prev => ({ ...prev, [tradeId]: true }));
      
      setTimeout(() => {
        console.log(`[PHYSICAL] Saving comment for trade ${tradeId}: ${comment}`);
        // Add toast functionality here if needed
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

  // Open the dialog instead of deleting immediately
  const handleDeleteTrade = (tradeId: string, tradeReference: string) => {
    if (isPerformingAction || isProcessingRef.current) {
      return;
    }
    
    setDeleteItemType('trade');
    setItemToDeleteId(tradeId);
    setItemToDeleteReference(tradeReference);
    setParentTradeId(''); // Not needed for trade deletion
    setIsDialogOpen(true);
  };

  // Open the dialog instead of deleting immediately
  const handleDeleteTradeLeg = (legId: string, legReference: string, parentId: string) => {
    if (isPerformingAction || isProcessingRef.current) {
      return;
    }
    
    setDeleteItemType('leg');
    setItemToDeleteId(legId);
    setItemToDeleteReference(legReference);
    setParentTradeId(parentId);
    setIsDialogOpen(true);
  };

  // Reset all delete-related states
  const resetDeleteStates = () => {
    // Allow a small delay for animation to complete
    cleanupTimerRef.current = setTimeout(() => {
      setIsDeleting(false);
      setDeletingTradeId('');
      setDeletionProgress(0);
      setIsPerformingAction(false);
      isProcessingRef.current = false;
      
      // Ensure subscriptions are resumed
      if (realtimeChannelsRef) {
        resumePhysicalSubscriptions(realtimeChannelsRef.current);
      }
      
      // Clear the timeout reference
      cleanupTimerRef.current = null;
    }, 300);
  };

  // Close dialog safely
  const handleCloseDialog = () => {
    // Only allow closing if not in the middle of an action
    if (!isPerformingAction) {
      setIsDialogOpen(false);
      
      // Ensure all delete states are reset after dialog animation completes
      cleanupTimerRef.current = setTimeout(() => {
        resetDeleteStates();
      }, 300);
    }
  };

  // Handler for confirmed deletion - separated from dialog close
  const handleConfirmDelete = async () => {
    if (isProcessingRef.current || isPerformingAction) {
      return;
    }
    
    try {
      // Set states to indicate processing
      setIsPerformingAction(true);
      isProcessingRef.current = true;
      
      // Keep the dialog open during the initial phase
      // Let's control when to close it based on our progress
      
      // Small delay before starting the actual operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now start the deletion process
      console.log(`[PHYSICAL] Deleting ${deleteItemType}: ${itemToDeleteId} (${itemToDeleteReference})`);
      setIsDeleting(true);
      setDeletingTradeId(itemToDeleteId);
      
      // Close the dialog now that we've started the deletion
      setIsDialogOpen(false);
      
      // Pause subscriptions to prevent race conditions during delete
      if (realtimeChannelsRef) {
        pausePhysicalSubscriptions(realtimeChannelsRef.current);
      }
      
      // Wait for dialog animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const progress = (value: number) => {
        console.log(`[PHYSICAL] Delete progress: ${value}%`);
        setDeletionProgress(value);
      };
      
      let success = false;
      
      if (deleteItemType === 'trade') {
        success = await deletePhysicalTrade(itemToDeleteId, progress);
        if (success) {
          toast.success(`Trade ${itemToDeleteReference} deleted successfully`);
        }
      } else {
        success = await deletePhysicalTradeLeg(itemToDeleteId, parentTradeId, progress);
        if (success) {
          toast.success(`Trade leg ${itemToDeleteReference} deleted successfully`);
        }
      }
      
      if (success) {
        // Small delay before refetching
        await new Promise(resolve => setTimeout(resolve, 200));
        refetchTrades();
      }
    } catch (error) {
      console.error('[PHYSICAL] Error during delete:', error);
      toast.error(`Failed to delete ${deleteItemType}`, { 
        description: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      // Reset all states in a controlled manner
      resetDeleteStates();
    }
  };

  if (loading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error} onRetry={refetchTrades} />;
  }

  return (
    <>
      <DeleteProgressIndicator 
        isDeleting={isDeleting} 
        deletingId={deletingTradeId} 
        progress={deletionProgress} 
      />

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
                  isDeleting={isDeleting}
                  deletingTradeId={deletingTradeId}
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
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        itemType={deleteItemType}
        itemReference={itemToDeleteReference}
        isPerformingAction={isPerformingAction}
      />
    </>
  );
};

export default PhysicalTradeTable;
