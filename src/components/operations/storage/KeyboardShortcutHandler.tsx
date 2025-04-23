
import React, { useEffect, useCallback } from 'react';
import { useKeyboardNavigationContext } from '@/contexts/KeyboardNavigationContext';

interface KeyboardShortcutHandlerProps {
  terminals: any[];
  selectedTerminalId: string | undefined;
  onTerminalChange: (terminalId: string) => void;
  onAddTank: () => void;
  onAddTerminal: () => void;
  gridRef: React.RefObject<HTMLDivElement>;
  leftPanelRef: React.RefObject<HTMLDivElement>;
  rightPanelRef: React.RefObject<HTMLDivElement>;
  childrenRef: React.RefObject<HTMLDivElement>;
  leftColumnCount: number;
  rightColumnCount: number;
  rowCount: number;
  headerRowCount: number;
}

const KeyboardShortcutHandler: React.FC<KeyboardShortcutHandlerProps> = ({
  terminals,
  selectedTerminalId,
  onTerminalChange,
  onAddTank,
  onAddTerminal,
  gridRef,
  leftPanelRef,
  rightPanelRef,
  childrenRef,
  leftColumnCount,
  rightColumnCount,
  rowCount,
  headerRowCount,
}) => {
  const {
    shortcutMode,
    setShortcutMode,
    selectedCell,
    setSelectedCell,
    isEditing,
    handleEscape,
  } = useKeyboardNavigationContext();

  const handleArrowNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) {
      // If no cell is selected, start with the top-left
      setSelectedCell({ row: -headerRowCount, col: 0, panel: 'left' });
      return;
    }

    let { row, col, panel } = selectedCell;
    const totalLeftCols = leftColumnCount;
    const totalRightCols = rightColumnCount;
    const totalRows = rowCount;

    console.log(`Starting navigation: panel=${panel}, row=${row}, col=${col}, direction=${direction}`);
    console.log(`Counts: leftCols=${totalLeftCols}, rightCols=${totalRightCols}, rows=${totalRows}, headerRows=${headerRowCount}`);

    switch (direction) {
      case 'up':
        // Allow navigation into header rows (negative indices)
        row = Math.max(-headerRowCount, row - 1);
        break;
      case 'down':
        // Navigate down but not past the last row
        row = Math.min(totalRows - 1, row + 1);
        break;
      case 'left':
        if (col > 0) {
          // Navigate within the same panel
          col--;
        } else if (panel === 'right') {
          // Move from first column in right panel to last column in left panel
          panel = 'left';
          col = totalLeftCols - 1;
        }
        break;
      case 'right':
        if (panel === 'left' && col < totalLeftCols - 1) {
          // Navigate within left panel
          col++;
        } else if (panel === 'left' && col === totalLeftCols - 1) {
          // Move from last column in left panel to first column in right panel
          panel = 'right';
          col = 0;
        } else if (panel === 'right' && col < totalRightCols - 1) {
          // Navigate within right panel
          col++;
        }
        break;
    }

    console.log(`New cell: panel=${panel}, row=${row}, col=${col}`);
    
    // Verify the cell exists before setting it
    const cellExists = document.querySelector(`[data-gridcell="${panel}-${row}-${col}"]`);
    if (cellExists) {
      setSelectedCell({ row, col, panel });
      scrollCellIntoView({ row, col, panel });
    } else {
      console.log(`Cell not found: ${panel}-${row}-${col}`);
    }
  }, [selectedCell, setSelectedCell, leftColumnCount, rightColumnCount, rowCount, headerRowCount]);

  const scrollCellIntoView = useCallback((cell: { row: number, col: number, panel: 'left' | 'right' }) => {
    console.log(`Attempting to scroll cell into view: ${cell.panel}-${cell.row}-${cell.col}`);
    const cellElement = document.querySelector(`[data-gridcell="${cell.panel}-${cell.row}-${cell.col}"]`) as HTMLElement;
    if (!cellElement) {
      console.log(`Cell element not found: ${cell.panel}-${cell.row}-${cell.col}`);
      return;
    }

    const containerRef = cell.panel === 'left' ? leftPanelRef : rightPanelRef;
    const container = containerRef.current;
    if (!container) {
      console.log(`Container not found for panel: ${cell.panel}`);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cellRect = cellElement.getBoundingClientRect();

    console.log(`Container: ${containerRect.top}, ${containerRect.bottom}, ${containerRect.left}, ${containerRect.right}`);
    console.log(`Cell: ${cellRect.top}, ${cellRect.bottom}, ${cellRect.left}, ${cellRect.right}`);

    // Only scroll if cell is not fully visible
    const isVerticallyVisible = 
      cellRect.top >= containerRect.top && 
      cellRect.bottom <= containerRect.bottom;
    
    const isHorizontallyVisible = 
      cellRect.left >= containerRect.left && 
      cellRect.right <= containerRect.right;

    if (!isVerticallyVisible || !isHorizontallyVisible) {
      console.log(`Scrolling cell into view: ${cell.panel}-${cell.row}-${cell.col}`);
      cellElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'nearest' 
      });
    }
  }, [leftPanelRef, rightPanelRef]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip all keyboard handling if there's an active input/select element
    const activeElement = document.activeElement;
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'SELECT' ||
      activeElement.hasAttribute('contenteditable')
    );

    if (isInputActive && e.key !== 'Escape') {
      return;
    }

    // Global shortcut handlers (always active)
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      onAddTank();
      return;
    }

    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      onAddTerminal();
      return;
    }

    if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      if (!selectedTerminalId || terminals.length <= 1) return;
      
      const currentIndex = terminals.findIndex(t => t.id === selectedTerminalId);
      if (currentIndex === -1) return;
      
      const nextIndex = e.key === 'ArrowRight' 
        ? (currentIndex + 1) % terminals.length
        : (currentIndex - 1 + terminals.length) % terminals.length;
        
      onTerminalChange(terminals[nextIndex].id);
      return;
    }

    // Escape handler
    if (e.key === 'Escape') {
      e.preventDefault();
      handleEscape();
      return;
    }

    // Activate navigation mode when arrows are pressed
    if (!isEditing && shortcutMode === 'none' && 
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      setShortcutMode('cellNavigation');
      // Start with first cell if none selected
      if (!selectedCell) {
        setSelectedCell({ row: 0, col: 0, panel: 'left' });
      }
      handleArrowNavigation(e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right');
      return;
    }

    // Navigation mode active - handle arrow keys
    if (shortcutMode === 'cellNavigation' && !isEditing) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleArrowNavigation(e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right');
      }
    }
  }, [
    shortcutMode, 
    isEditing, 
    selectedCell, 
    setShortcutMode, 
    setSelectedCell, 
    handleArrowNavigation,
    handleEscape,
    onAddTank,
    onAddTerminal,
    onTerminalChange,
    terminals,
    selectedTerminalId
  ]);

  // Add global keyboard listener
  useEffect(() => {
    const mainRef = gridRef.current;
    if (!mainRef) return;

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gridRef, handleKeyDown]);

  // Add click outside handler to deactivate navigation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shortcutMode === 'none' || isEditing) return;

      // Check if click is inside the storage grid
      const childContainer = childrenRef.current;
      if (childContainer && !childContainer.contains(e.target as Node)) {
        setShortcutMode('none');
        setSelectedCell(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [childrenRef, shortcutMode, isEditing, setShortcutMode, setSelectedCell]);

  return null; // This is a behavior-only component
};

export default KeyboardShortcutHandler;
