
import { useReducer, useCallback } from 'react';

// State machine states for deletion operations
export type DeleteState = 
  | { status: 'idle' } 
  | { status: 'confirm_requested', itemId: string, itemReference: string, isLeg: boolean, parentId?: string }
  | { status: 'deleting', itemId: string, progress: number }
  | { status: 'pausing_subscriptions' }
  | { status: 'resuming_subscriptions' }
  | { status: 'success', message: string }
  | { status: 'error', error: Error | string }
  | { status: 'cancelled' };

// Actions that can be dispatched to change state
type DeleteAction = 
  | { type: 'OPEN_CONFIRM_DIALOG', itemId: string, itemReference: string, isLeg: boolean, parentId?: string }
  | { type: 'START_DELETE' }
  | { type: 'PAUSE_SUBSCRIPTIONS' }
  | { type: 'RESUME_SUBSCRIPTIONS' }
  | { type: 'UPDATE_PROGRESS', progress: number }
  | { type: 'DELETE_SUCCESS', message: string }
  | { type: 'DELETE_ERROR', error: Error | string }
  | { type: 'CANCEL_DELETE' }
  | { type: 'RESET' };

// Reducer function that handles state transitions
function deleteReducer(state: DeleteState, action: DeleteAction): DeleteState {
  console.log(`[DeleteMachine] Action: ${action.type} in state: ${state.status}`);
  
  switch (action.type) {
    case 'OPEN_CONFIRM_DIALOG':
      return { 
        status: 'confirm_requested', 
        itemId: action.itemId, 
        itemReference: action.itemReference,
        isLeg: action.isLeg,
        parentId: action.parentId
      };
      
    case 'START_DELETE':
      if (state.status !== 'confirm_requested') {
        console.error('[DeleteMachine] Cannot start delete: not in confirm_requested state');
        return state;
      }
      return { 
        status: 'deleting', 
        itemId: state.itemId, 
        progress: 0 
      };
      
    case 'PAUSE_SUBSCRIPTIONS':
      if (state.status !== 'deleting') {
        console.error('[DeleteMachine] Cannot pause subscriptions: not in deleting state');
        return state;
      }
      return { status: 'pausing_subscriptions' };
      
    case 'RESUME_SUBSCRIPTIONS':
      return { status: 'resuming_subscriptions' };
      
    case 'UPDATE_PROGRESS':
      if (state.status !== 'deleting') {
        console.error('[DeleteMachine] Cannot update progress: not in deleting state');
        return state;
      }
      return { 
        ...state, 
        progress: action.progress 
      };
      
    case 'DELETE_SUCCESS':
      return { 
        status: 'success', 
        message: action.message 
      };
      
    case 'DELETE_ERROR':
      return { 
        status: 'error', 
        error: action.error 
      };
      
    case 'CANCEL_DELETE':
      // We can cancel from multiple states
      return { status: 'cancelled' };
      
    case 'RESET':
      return { status: 'idle' };
      
    default:
      console.error(`[DeleteMachine] Unknown action: ${JSON.stringify(action)}`);
      return state;
  }
}

export function useDeleteStateMachine() {
  const [state, dispatch] = useReducer(deleteReducer, { status: 'idle' });
  
  // Wrapped dispatch functions for better type safety and usability
  const actions = {
    openConfirmDialog: useCallback((itemId: string, itemReference: string, isLeg: boolean = false, parentId?: string) => {
      dispatch({ 
        type: 'OPEN_CONFIRM_DIALOG', 
        itemId, 
        itemReference,
        isLeg,
        parentId
      });
    }, []),
    
    startDelete: useCallback(() => {
      dispatch({ type: 'START_DELETE' });
    }, []),
    
    pauseSubscriptions: useCallback(() => {
      dispatch({ type: 'PAUSE_SUBSCRIPTIONS' });
    }, []),
    
    resumeSubscriptions: useCallback(() => {
      dispatch({ type: 'RESUME_SUBSCRIPTIONS' });
    }, []),
    
    updateProgress: useCallback((progress: number) => {
      dispatch({ type: 'UPDATE_PROGRESS', progress });
    }, []),
    
    deleteSuccess: useCallback((message: string) => {
      dispatch({ type: 'DELETE_SUCCESS', message });
    }, []),
    
    deleteError: useCallback((error: Error | string) => {
      dispatch({ type: 'DELETE_ERROR', error });
    }, []),
    
    cancelDelete: useCallback(() => {
      dispatch({ type: 'CANCEL_DELETE' });
    }, []),
    
    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, [])
  };
  
  return { state, actions };
}
