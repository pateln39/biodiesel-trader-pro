
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useKeyboardNavigationContext, ShortcutMode } from '@/contexts/KeyboardNavigationContext';
import { cn } from '@/lib/utils';

interface KeyboardNavigableCellProps {
  children: React.ReactNode;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: (shift: boolean) => void;
  onArrow?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  className?: string;
  allowEditing?: boolean;
  cellPosition?: { row: number; col: number; panel: 'left' | 'right' | 'headerLeft' | 'headerRight' | null };
  isActive?: boolean;
}

const KeyboardNavigableCell: React.FC<KeyboardNavigableCellProps> = ({
  children,
  onEnter,
  onEscape,
  onTab,
  onArrow,
  className,
  allowEditing = false,
  cellPosition,
  isActive = false,
}) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const { 
    shortcutMode, 
    setShortcutMode,
    selectedCell,
    navigateToCell,
    enterEditMode,
    exitEditMode
  } = useKeyboardNavigationContext();
  
  const [isEditing, setIsEditing] = useState(false);

  // Focus the cell when selected
  useEffect(() => {
    if (cellRef.current && isActive && shortcutMode === 'cellNavigation') {
      cellRef.current.focus();
      
      // Scroll into view if needed, but only if not already visible
      const rect = cellRef.current.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      
      if (!isVisible) {
        cellRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'nearest' 
        });
      }
    }
  }, [isActive, shortcutMode]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // If we're in editing mode, let the child component handle keyboard events
    if (isEditing || shortcutMode === 'editing') {
      return;
    }

    // Handle keyboard shortcuts in cell navigation mode
    switch (e.key) {
      case 'Enter':
        if (onEnter) {
          e.preventDefault();
          e.stopPropagation();
          onEnter();
          if (allowEditing) {
            setIsEditing(true);
            enterEditMode();
          }
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          e.stopPropagation();
          onEscape();
        }
        break;
      case 'Tab':
        if (onTab) {
          e.preventDefault();
          onTab(e.shiftKey);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        // Stop propagation to prevent default scrolling
        e.preventDefault();
        
        if (onArrow) {
          const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          onArrow(direction);
        }
        break;
      }
      default:
        break;
    }
  };

  // Handle double click to enter editing mode
  const handleDoubleClick = () => {
    if (allowEditing && onEnter) {
      onEnter();
      setIsEditing(true);
      enterEditMode();
    }
  };

  // Handle single click to activate this cell for navigation
  const handleClick = () => {
    if (cellPosition) {
      navigateToCell(cellPosition);
    }
  };

  return (
    <div
      ref={cellRef}
      className={cn(
        className,
        isActive && "ring-[3px] ring-brand-lime ring-inset",
        isEditing && "ring-2 ring-blue-500 ring-inset"
      )}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-row={cellPosition?.row}
      data-col={cellPosition?.col}
      data-panel={cellPosition?.panel}
    >
      {children}
    </div>
  );
};

export default KeyboardNavigableCell;
