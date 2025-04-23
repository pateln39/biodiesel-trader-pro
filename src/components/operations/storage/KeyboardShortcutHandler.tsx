
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

    switch (direction) {
      case 'up':
        row = Math.max(-headerRowCount, row - 1);
        break;
      case 'down':
        row = Math.min(totalRows - 1, row + 1);
        break;
      case 'left':
        if (col > 0) {
          col--;
        } else if (panel === 'right') {
          panel = 'left';
          col = totalLeftCols - 1;
        }
        break;
      case 'right':
        if (panel === 'left' && col < totalLeftCols - 1) {
          col++;
        } else if (panel === 'left' && col === totalLeftCols - 1) {
          panel = 'right';
          col = 0;
        } else if (panel === 'right' && col < totalRightCols - 1) {
          col++;
        }
        break;
    }

    // Verify the cell exists before setting it
    const cellExists = document.querySelector(`[data-gridcell="${panel}-${row}-${col}"]`);
    if (cellExists) {
      setSelectedCell({ row, col, panel });
      scrollCellIntoView({ row, col, panel });
    }
  }, [selectedCell, setSelectedCell, leftColumnCount, rightColumnCount, rowCount, headerRowCount]);

  const scrollCellIntoView = useCallback((cell: { row: number, col: number, panel: 'left' | 'right' }) => {
    const cellElement = document.querySelector(`[data-gridcell="${cell.panel}-${cell.row}-${cell.col}"]`) as HTMLElement;
    if (!cellElement) {
      return;
    }

    const containerRef = cell.panel === 'left' ? leftPanelRef : rightPanelRef;
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cellRect = cellElement.getBoundingClientRect();

    // Only scroll if cell is not fully visible
    const isVerticallyVisible = 
      cellRect.top >= containerRect.top && 
      cellRect.bottom <= containerRect.bottom;
    
    const isHorizontallyVisible = 
      cellRect.left >= containerRect.left && 
      cellRect.right <= containerRect.right;

    if (!isVerticallyVisible || !isHorizontallyVisible) {
      cellElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'nearest' 
      });
    }
  }, [leftPanelRef, rightPanelRef]);

  // The main keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle if typing/editing
    const activeElement = document.activeElement;
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'SELECT' ||
      activeElement.hasAttribute('contenteditable')
    );
    if (isInputActive && e.key !== 'Escape') return;

    // Storage page shortcuts
    if (e.altKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      onAddTank();
      return;
    }

    if (e.altKey && e.key.toLowerCase() === 'n') {
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

    // Navigation activation by arrow keys
    if (!isEditing && shortcutMode === 'none' && 
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      setShortcutMode('cellNavigation');
      if (!selectedCell) {
        setSelectedCell({ row: 0, col: 0, panel: 'left' });
      }
      handleArrowNavigation(e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right');
      return;
    }

    // Navigation mode active
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

  // Add global keyboard listener only on mount
  useEffect(() => {
    if (!gridRef.current) return;
    window.addEventListener('keydown', handleKeyDown, true); // capture to override default behavior
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [gridRef, handleKeyDown]);

  // Click outside disables navigation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shortcutMode === 'none' || isEditing) return;
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
