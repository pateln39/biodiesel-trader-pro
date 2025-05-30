
import { create } from 'zustand';

interface BulkOperationState {
  activeBulkOperations: Set<string>;
  isBulkMode: boolean;
  lastBulkOperationEnd: number | null;
  cooldownPeriod: number; // milliseconds
}

interface BulkOperationStore extends BulkOperationState {
  startBulkOperation: (operationId: string) => void;
  endBulkOperation: (operationId: string) => void;
  isInCooldownPeriod: () => boolean;
  getAdaptiveDebounceDelay: () => number;
}

const COOLDOWN_PERIOD = 5000; // 5 seconds after bulk operation ends
const NORMAL_DEBOUNCE = 500; // Normal debounce delay
const BULK_DEBOUNCE = 8000; // Debounce delay during bulk operations

export const useBulkOperationStore = create<BulkOperationStore>((set, get) => ({
  activeBulkOperations: new Set(),
  isBulkMode: false,
  lastBulkOperationEnd: null,
  cooldownPeriod: COOLDOWN_PERIOD,

  startBulkOperation: (operationId: string) => {
    set((state) => {
      const newOperations = new Set(state.activeBulkOperations);
      newOperations.add(operationId);
      
      console.log(`[BULK_MANAGER] Starting bulk operation: ${operationId}`);
      console.log(`[BULK_MANAGER] Active operations:`, Array.from(newOperations));
      
      return {
        activeBulkOperations: newOperations,
        isBulkMode: newOperations.size > 0,
        lastBulkOperationEnd: null
      };
    });
  },

  endBulkOperation: (operationId: string) => {
    set((state) => {
      const newOperations = new Set(state.activeBulkOperations);
      newOperations.delete(operationId);
      
      const isBulkMode = newOperations.size > 0;
      const lastBulkOperationEnd = isBulkMode ? state.lastBulkOperationEnd : Date.now();
      
      console.log(`[BULK_MANAGER] Ending bulk operation: ${operationId}`);
      console.log(`[BULK_MANAGER] Active operations:`, Array.from(newOperations));
      console.log(`[BULK_MANAGER] Bulk mode:`, isBulkMode);
      
      return {
        activeBulkOperations: newOperations,
        isBulkMode,
        lastBulkOperationEnd
      };
    });
  },

  isInCooldownPeriod: () => {
    const state = get();
    if (!state.lastBulkOperationEnd || state.isBulkMode) return false;
    
    const timeSinceEnd = Date.now() - state.lastBulkOperationEnd;
    return timeSinceEnd < state.cooldownPeriod;
  },

  getAdaptiveDebounceDelay: () => {
    const state = get();
    if (state.isBulkMode || state.isInCooldownPeriod()) {
      return BULK_DEBOUNCE;
    }
    return NORMAL_DEBOUNCE;
  }
}));

// Utility functions for external use
export const startBulkOperation = (operationId: string) => {
  useBulkOperationStore.getState().startBulkOperation(operationId);
};

export const endBulkOperation = (operationId: string) => {
  useBulkOperationStore.getState().endBulkOperation(operationId);
};

export const isBulkModeActive = () => {
  return useBulkOperationStore.getState().isBulkMode;
};

export const isInCooldownPeriod = () => {
  return useBulkOperationStore.getState().isInCooldownPeriod();
};

export const getAdaptiveDebounceDelay = () => {
  return useBulkOperationStore.getState().getAdaptiveDebounceDelay();
};
