
import { useReducer, useCallback, useRef, useEffect } from 'react';
import { deletionReducer, initialDeletionContext, DeletionAction, DeletionContext } from '@/utils/tradeStateMachine';
import { deletePhysicalTrade, deletePhysicalTradeLeg } from '@/utils/physicalTradeDeleteUtils';
import { pausePhysicalSubscriptions, resumePhysicalSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';

interface UseDeletionStateProps {
  refetchTrades: () => void;
  realtimeChannelsRef?: React.MutableRefObject<{ [key: string]: any }>;
}

export const useDeletionState = ({ refetchTrades, realtimeChannelsRef }: UseDeletionStateProps) => {
  const [deletionContext, dispatch] = useReducer(deletionReducer, initialDeletionContext);
  const operationInProgressRef = useRef(false);
  
  // Debug logging for state changes
  useEffect(() => {
    console.log(`[DELETION_STATE] State changed to: ${deletionContext.state}`, deletionContext);
  }, [deletionContext]);
  
  // Open confirmation dialog for deleting a trade or leg
  const openDeleteConfirmation = useCallback((
    itemType: 'trade' | 'leg',
    itemId: string,
    itemReference: string,
    parentId?: string
  ) => {
    // Prevent multiple operations
    if (operationInProgressRef.current || deletionContext.isProcessing) {
      console.log('[DELETION] Operation in progress, ignoring request');
      return;
    }
    
    console.log(`[DELETION] Opening confirmation for ${itemType} ${itemId} (${itemReference})`);
    
    dispatch({ 
      type: 'OPEN_CONFIRMATION', 
      itemType, 
      itemId, 
      itemReference,
      parentId
    });
  }, [deletionContext.isProcessing]);
  
  // Cancel the delete operation
  const cancelDelete = useCallback(() => {
    console.log(`[DELETION] Cancel requested, current state: ${deletionContext.state}`);
    
    if (deletionContext.isProcessing) {
      console.log('[DELETION] Cannot cancel while deletion is in progress');
      return;
    }
    
    dispatch({ type: 'CANCEL' });
  }, [deletionContext.state, deletionContext.isProcessing]);
  
  // Confirm and execute the deletion
  const confirmDelete = useCallback(async () => {
    console.log(`[DELETION] Confirm requested, current state: ${deletionContext.state}`);
    
    if (operationInProgressRef.current) {
      console.log('[DELETION] Operation already in progress, ignoring request');
      return;
    }
    
    if (deletionContext.isProcessing) {
      console.log('[DELETION] Already processing, ignoring duplicate confirm request');
      return;
    }
    
    if (!deletionContext.itemId || !deletionContext.itemType) {
      console.log('[DELETION] Invalid state for deletion, missing itemId or itemType');
      return;
    }
    
    try {
      console.log('[DELETION] Setting operation in progress flag');
      operationInProgressRef.current = true;
      
      // Transition to deleting state
      dispatch({ type: 'CONFIRM_DELETE' });
      
      // Pause subscriptions to prevent race conditions
      if (realtimeChannelsRef) {
        console.log('[DELETION] Pausing realtime subscriptions');
        pausePhysicalSubscriptions(realtimeChannelsRef.current);
      }
      
      // Set up progress tracking callback
      const trackProgress = (progress: number) => {
        console.log(`[DELETION] Progress update: ${progress}%`);
        dispatch({ type: 'SET_PROGRESS', progress });
      };
      
      // Perform the actual deletion
      let success = false;
      
      if (deletionContext.itemType === 'trade') {
        console.log(`[DELETION] Deleting trade ${deletionContext.itemId}`);
        success = await deletePhysicalTrade(deletionContext.itemId, trackProgress);
      } else if (deletionContext.itemType === 'leg' && deletionContext.parentId) {
        console.log(`[DELETION] Deleting leg ${deletionContext.itemId} of trade ${deletionContext.parentId}`);
        success = await deletePhysicalTradeLeg(
          deletionContext.itemId, 
          deletionContext.parentId, 
          trackProgress
        );
      }
      
      // Handle success or failure
      if (success) {
        console.log('[DELETION] Operation completed successfully');
        dispatch({ type: 'SET_SUCCESS' });
        
        // Delay the refetch slightly to allow the UI to update
        setTimeout(() => {
          console.log('[DELETION] Triggering refetch after successful delete');
          refetchTrades();
        }, 500);
      } else {
        console.log('[DELETION] Operation failed without throwing an error');
        throw new Error('Deletion operation failed');
      }
    } catch (error) {
      console.error('[DELETION] Error during deletion:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      });
    } finally {
      // Always resume subscriptions, but with a delay
      if (realtimeChannelsRef) {
        console.log('[DELETION] Scheduling resumption of subscriptions');
        setTimeout(() => {
          console.log('[DELETION] Resuming realtime subscriptions');
          resumePhysicalSubscriptions(realtimeChannelsRef.current);
          
          console.log('[DELETION] Clearing operation in progress flag');
          operationInProgressRef.current = false;
        }, 800); // Increased delay to prevent race conditions
      } else {
        console.log('[DELETION] No channels ref, directly clearing operation flag');
        operationInProgressRef.current = false;
      }
    }
  }, [deletionContext, refetchTrades, realtimeChannelsRef]);
  
  // Reset the state after completion or error
  const resetDeletionState = useCallback(() => {
    if (deletionContext.isProcessing) {
      console.log('[DELETION] Refusing to reset while delete is in progress');
      return;
    }
    
    console.log('[DELETION] Resetting state machine');
    dispatch({ type: 'RESET' });
  }, [deletionContext.isProcessing]);
  
  return {
    deletionContext,
    openDeleteConfirmation,
    cancelDelete,
    confirmDelete,
    resetDeletionState
  };
};
