
import React, { useRef, useEffect, KeyboardEvent } from 'react';
import { useKeyboardNavigationContext } from '@/contexts/KeyboardNavigationContext';
import { cn } from '@/lib/utils';

interface KeyboardNavigableCellProps {
  children: React.ReactNode;
  row: number;
  col: number;
  panel: 'left' | 'right';
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: (shift: boolean) => void;
  onArrow?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  className?: string;
  allowEditing?: boolean;
}

const KeyboardNavigableCell: React.FC<KeyboardNavigableCellProps> = ({
  children,
  row,
  col,
  panel,
  onEnter,
  onEscape,
  onTab,
  onArrow,
  className,
  allowEditing = false,
}) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const {
    shortcutMode,
    selectedCell,
    setSelectedCell,
    setShortcutMode,
    startEditing,
  } = useKeyboardNavigationContext();

  // Check if this cell is the currently selected one
  const isSelected = selectedCell?.row === row && 
                      selectedCell?.col === col && 
                      selectedCell?.panel === panel;

  // Focus the cell when selected
  useEffect(() => {
    if (cellRef.current && isSelected && shortcutMode === 'cellNavigation') {
      cellRef.current.focus();
    }
  }, [isSelected, shortcutMode]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // If we're in editing mode, let the child component handle keyboard events
    if (shortcutMode === 'editing') {
      return;
    }

    // Handle keyboard shortcuts in cell navigation mode
    switch (e.key) {
      case 'Enter':
        if (onEnter && isSelected) {
          e.preventDefault();
          onEnter();
          if (allowEditing) {
            startEditing();
          }
        }
        break;
      case 'Escape':
        if (onEscape && isSelected) {
          e.preventDefault();
          onEscape();
        }
        break;
      case 'Tab':
        if (onTab && isSelected) {
          e.preventDefault();
          onTab(e.shiftKey);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (onArrow && isSelected) {
          e.preventDefault();
          onArrow(e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right');
        }
        break;
      default:
        break;
    }
  };

  const handleClick = () => {
    // Select this cell and activate navigation mode if not already active
    setSelectedCell({ row, col, panel });
    if (shortcutMode !== 'cellNavigation') {
      setShortcutMode('cellNavigation');
    }
  };

  // Handle double click to enter editing mode
  const handleDoubleClick = () => {
    if (allowEditing && onEnter) {
      onEnter();
      startEditing();
    }
  };

  return (
    <div
      ref={cellRef}
      className={cn(
        className,
        isSelected && shortcutMode === 'cellNavigation' && 
          "outline outline-4 outline-brand-lime outline-offset-[-4px]"
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-gridcell={`${panel}-${row}-${col}`}
    >
      {children}
    </div>
  );
};

export default KeyboardNavigableCell;
