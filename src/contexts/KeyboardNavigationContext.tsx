
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, KeyboardEvent } from 'react';

// Define all possible shortcut modes
export type ShortcutMode = 'editing' | 'cellNavigation' | 'none';

// Define panel types
export type NavigationPanel = 'left' | 'right' | 'headerLeft' | 'headerRight' | null;

// Cell position interface
export interface CellPosition {
  row: number;
  col: number;
  panel: NavigationPanel;
}

interface KeyboardNavigationContextType {
  // Mode management
  shortcutMode: ShortcutMode;
  setShortcutMode: (mode: ShortcutMode) => void;
  
  // Cell selection
  selectedCell: CellPosition | null;
  setSelectedCell: (cell: CellPosition | null) => void;
  
  // Navigation helpers
  navigateToCell: (position: CellPosition) => void;
  navigateInDirection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // Panel management
  activePanel: NavigationPanel;
  setActivePanel: (panel: NavigationPanel) => void;
  
  // Utility functions
  exitNavigation: () => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
  isInHeaderRow: boolean;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(undefined);

export const KeyboardNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shortcutMode, setShortcutMode] = useState<ShortcutMode>('none');
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [activePanel, setActivePanel] = useState<NavigationPanel>(null);
  const [isInHeaderRow, setIsInHeaderRow] = useState(false);

  // Navigate to a specific cell
  const navigateToCell = useCallback((position: CellPosition) => {
    setSelectedCell(position);
    setActivePanel(position.panel);
    setShortcutMode('cellNavigation');
    
    // Check if the cell is in a header row (row < 0 indicates header rows)
    setIsInHeaderRow(position.row < 0);
    
    // Scroll the cell into view if needed (implemented via useEffect)
  }, []);

  // Navigate in a direction based on current position
  const navigateInDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;
    
    // This is a placeholder - the actual implementation will be in the KeyboardShortcutHandler
    // as it needs access to the grid structure data
    console.log(`Navigate ${direction} from`, selectedCell);
  }, [selectedCell]);

  // Exit navigation mode completely
  const exitNavigation = useCallback(() => {
    setShortcutMode('none');
    setSelectedCell(null);
    setActivePanel(null);
  }, []);

  // Enter edit mode for the current cell
  const enterEditMode = useCallback(() => {
    setShortcutMode('editing');
  }, []);

  // Exit edit mode and return to navigation mode
  const exitEditMode = useCallback(() => {
    setShortcutMode('cellNavigation');
  }, []);

  return (
    <KeyboardNavigationContext.Provider
      value={{
        shortcutMode,
        setShortcutMode,
        selectedCell,
        setSelectedCell,
        navigateToCell,
        navigateInDirection,
        activePanel,
        setActivePanel,
        exitNavigation,
        enterEditMode,
        exitEditMode,
        isInHeaderRow,
      }}
    >
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export const useKeyboardNavigationContext = (): KeyboardNavigationContextType => {
  const context = useContext(KeyboardNavigationContext);
  if (context === undefined) {
    throw new Error('useKeyboardNavigationContext must be used within a KeyboardNavigationProvider');
  }
  return context;
};
