
import { toast } from 'sonner';

/**
 * Defines all possible states in the trade deletion flow
 */
export type DeletionState = 
  | 'idle'               // No deletion in progress
  | 'confirming'         // User is being asked to confirm deletion
  | 'deleting'           // Deletion in progress, communicating with database
  | 'success'            // Deletion completed successfully
  | 'error';             // Error occurred during deletion

/**
 * Defines all possible actions that can trigger state transitions
 */
export type DeletionAction =
  | { type: 'OPEN_CONFIRMATION'; itemType: 'trade' | 'leg'; itemId: string; itemReference: string; parentId?: string }
  | { type: 'CONFIRM_DELETE' }
  | { type: 'CANCEL' }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'SET_SUCCESS' }
  | { type: 'SET_ERROR'; error: Error }
  | { type: 'RESET' };

/**
 * The complete state including all metadata needed during the deletion process
 */
export interface DeletionContext {
  state: DeletionState;
  itemType: 'trade' | 'leg' | null;
  itemId: string | null;
  itemReference: string | null;
  parentId: string | null;
  progress: number;
  error: Error | null;
  isProcessing: boolean;
}

/**
 * Initial deletion state context
 */
export const initialDeletionContext: DeletionContext = {
  state: 'idle',
  itemType: null,
  itemId: null,
  itemReference: null,
  parentId: null,
  progress: 0,
  error: null,
  isProcessing: false
};

/**
 * State machine reducer to handle all state transitions
 */
export function deletionReducer(context: DeletionContext, action: DeletionAction): DeletionContext {
  console.log(`[STATE MACHINE] Current state: ${context.state}, Action: ${action.type}`);
  
  switch (context.state) {
    case 'idle':
      if (action.type === 'OPEN_CONFIRMATION') {
        return {
          ...context,
          state: 'confirming',
          itemType: action.itemType,
          itemId: action.itemId,
          itemReference: action.itemReference,
          parentId: action.parentId || null,
          isProcessing: false
        };
      }
      break;
      
    case 'confirming':
      if (action.type === 'CONFIRM_DELETE') {
        return {
          ...context,
          state: 'deleting',
          progress: 0,
          isProcessing: true
        };
      } else if (action.type === 'CANCEL' || action.type === 'RESET') {
        console.log('[STATE MACHINE] Canceling confirmation dialog');
        return initialDeletionContext;
      }
      break;
      
    case 'deleting':
      if (action.type === 'SET_PROGRESS') {
        return {
          ...context,
          progress: action.progress
        };
      } else if (action.type === 'SET_SUCCESS') {
        console.log('[STATE MACHINE] Setting success state');
        const itemType = context.itemType === 'trade' ? 'Trade' : 'Trade leg';
        const itemRef = context.itemReference;
        
        // Show success toast
        toast.success(`${itemType} ${itemRef} deleted successfully`);
        
        return {
          ...context,
          state: 'success',
          progress: 100,
          isProcessing: false
        };
      } else if (action.type === 'SET_ERROR') {
        console.error('[STATE MACHINE] Setting error state:', action.error);
        
        // Show error toast
        toast.error(`Failed to delete ${context.itemType}`, {
          description: action.error.message || 'Unknown error occurred'
        });
        
        return {
          ...context,
          state: 'error',
          error: action.error,
          isProcessing: false
        };
      }
      break;
      
    case 'success':
    case 'error':
      if (action.type === 'RESET') {
        console.log('[STATE MACHINE] Resetting after completion');
        return initialDeletionContext;
      }
      
      if (action.type === 'OPEN_CONFIRMATION') {
        console.log('[STATE MACHINE] Opening new confirmation from success/error state');
        return {
          ...initialDeletionContext,
          state: 'confirming',
          itemType: action.itemType,
          itemId: action.itemId,
          itemReference: action.itemReference,
          parentId: action.parentId || null
        };
      }
      break;
  }
  
  console.log(`[STATE MACHINE] No state transition for action ${action.type} in state ${context.state}`);
  return context;
}
