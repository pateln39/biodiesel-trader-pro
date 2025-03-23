
import { useReducer, useCallback, useRef } from 'react';
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
    if (deletionContext.state === 'deleting') {
      console.log('[DELETION] Cannot cancel while deletion is in progress');
      return;
    }
    
    dispatch({ type: 'CANCEL' });
  }, [deletionContext.state]);
  
  // Confirm and execute the deletion
  const confirmDelete = useCallback(async () => {
    if (operationInProgressRef.current || !deletionContext.itemId || !deletionContext.itemType) {
      console.log('[DELETION] Invalid state for deletion or operation in progress');
      return;
    }
    
    try {
      operationInProgressRef.current = true;
      
      // Transition to deleting state
      dispatch({ type: 'CONFIRM_DELETE' });
      
      // Pause subscriptions to prevent race conditions
      if (realtimeChannelsRef) {
        pausePhysicalSubscriptions(realtimeChannelsRef.current);
      }
      
      // Set up progress tracking callback
      const trackProgress = (progress: number) => {
        dispatch({ type: 'SET_PROGRESS', progress });
      };
      
      // Perform the actual deletion
      let success = false;
      
      if (deletionContext.itemType === 'trade') {
        success = await deletePhysicalTrade(deletionContext.itemId, trackProgress);
      } else if (deletionContext.itemType === 'leg' && deletionContext.parentId) {
        success = await deletePhysicalTradeLeg(
          deletionContext.itemId, 
          deletionContext.parentId, 
          trackProgress
        );
      }
      
      // Handle success or failure
      if (success) {
        dispatch({ type: 'SET_SUCCESS' });
        refetchTrades();
      } else {
        throw new Error('Deletion operation failed');
      }
    } catch (error) {
      console.error('[DELETION] Error during deletion:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      });
    } finally {
      // Always resume subscriptions and reset operation flag
      if (realtimeChannelsRef) {
        setTimeout(() => {
          resumePhysicalSubscriptions(realtimeChannelsRef.current);
          operationInProgressRef.current = false;
        }, 500); // Small delay to prevent race conditions
      } else {
        operationInProgressRef.current = false;
      }
    }
  }, [deletionContext.itemId, deletionContext.itemType, deletionContext.parentId, refetchTrades, realtimeChannelsRef]);
  
  // Reset the state after completion or error
  const resetDeletionState = useCallback(() => {
    if (deletionContext.state !== 'deleting') {
      dispatch({ type: 'RESET' });
    }
  }, [deletionContext.state]);
  
  return {
    deletionContext,
    openDeleteConfirmation,
    cancelDelete,
    confirmDelete,
    resetDeletionState
  };
};
