
import React, { useEffect, useCallback, KeyboardEvent } from 'react';
import { useKeyboardNavigationContext, NavigationPanel, CellPosition } from '@/contexts/KeyboardNavigationContext';

interface KeyboardShortcutHandlerProps {
  onAddTank: () => void;
  onAddTerminal: () => void;
  onNavigateTerminal: (direction: 'next' | 'prev') => void;
  terminalsCount: number;
  selectedTerminalIndex: number;
  totalCols: {
    left: number;
    right: number;
    headerLeft: number;
    headerRight: number;
  };
  totalRows: number;
  headerRowsCount: number;
  children: React.ReactNode;
  sidebarOpen?: boolean;
  getCellAt: (position: CellPosition) => HTMLElement | null;
  getNextCellPosition: (currentPosition: CellPosition, direction: 'up' | 'down' | 'left' | 'right') => CellPosition | null;
}

const KeyboardShortcutHandler: React.FC<KeyboardShortcutHandlerProps> = ({
  onAddTank,
  onAddTerminal,
  onNavigateTerminal,
  terminalsCount,
  selectedTerminalIndex,
  totalCols,
  totalRows,
  headerRowsCount,
  children,
  sidebarOpen = false,
  getCellAt,
  getNextCellPosition,
}) => {
  const {
    shortcutMode,
    setShortcutMode,
    selectedCell,
    setSelectedCell,
    navigateToCell,
    exitNavigation,
    exitEditMode,
    activePanel,
  } = useKeyboardNavigationContext();

  // Handle global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't capture key events when sidebar is open
    if (sidebarOpen) return;

    // Global shortcuts (regardless of current mode)
    if (e.altKey && !e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 't': // Alt+T: Add Tank
          if (!e.shiftKey) {
            e.preventDefault();
            onAddTank();
            return;
          }
          break;
        case 'n': // Alt+N: Add Terminal
          e.preventDefault();
          onAddTerminal();
          return;
      }
    }

    // Terminal navigation with Ctrl + Arrow keys
    if (e.ctrlKey && !e.altKey) {
      switch (e.key) {
        case 'ArrowLeft': // Ctrl+Left: Previous Terminal
          e.preventDefault();
          onNavigateTerminal('prev');
          return;
        case 'ArrowRight': // Ctrl+Right: Next Terminal
          e.preventDefault();
          onNavigateTerminal('next');
          return;
      }
    }

    // Handle Escape - always exits current mode
    if (e.key === 'Escape') {
      e.preventDefault();
      if (shortcutMode === 'editing') {
        exitEditMode();
      } else if (shortcutMode === 'cellNavigation') {
        exitNavigation();
      }
      return;
    }

    // If not in any navigation mode, activate it on arrow keys
    if (shortcutMode === 'none' && !sidebarOpen) {
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        // Start with the first cell in the first row
        const initialPosition: CellPosition = {
          row: headerRowsCount, // Skip header rows
          col: 0,
          panel: 'left',
        };
        navigateToCell(initialPosition);
        return;
      }
    }

    // Handle navigation within the grid
    if (shortcutMode === 'cellNavigation' && selectedCell) {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault();
          const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          
          // Special case: When in the right-most cell of left panel and pressing right
          if (direction === 'right' && 
              selectedCell.panel === 'left' && 
              selectedCell.col === totalCols.left - 1) {
            // Move to the first cell in the right panel in the same row
            const rightPanelFirstCell: CellPosition = {
              row: selectedCell.row,
              col: 0,
              panel: 'right',
            };
            navigateToCell(rightPanelFirstCell);
            return;
          }
          
          // Get next cell position based on current and direction
          const nextPosition = getNextCellPosition(selectedCell, direction);
          if (nextPosition) {
            navigateToCell(nextPosition);
          }
          return;
        }
        case 'Enter': {
          // Enter key implementation will be handled by the KeyboardNavigableCell
          // This is just for any special global behavior
          break;
        }
      }
    }
  }, [
    sidebarOpen, 
    shortcutMode, 
    selectedCell, 
    totalCols,
    headerRowsCount,
    onAddTank, 
    onAddTerminal, 
    onNavigateTerminal,
    navigateToCell,
    exitNavigation,
    exitEditMode,
    getNextCellPosition
  ]);

  // Add global keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown as any);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown as any);
    };
  }, [handleGlobalKeyDown]);

  return <>{children}</>;
};

export default KeyboardShortcutHandler;
