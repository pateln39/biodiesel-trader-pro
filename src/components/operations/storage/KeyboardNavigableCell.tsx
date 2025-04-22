
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useKeyboardNavigationContext } from '@/contexts/KeyboardNavigationContext';

type ShortcutMode = 'editing' | 'cellNavigation';

interface KeyboardNavigableCellProps {
  children: React.ReactNode;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: (shift: boolean) => void;
  onArrow?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  className?: string;
  allowEditing?: boolean;
}

const KeyboardNavigableCell: React.FC<KeyboardNavigableCellProps> = ({
  children,
  onEnter,
  onEscape,
  onTab,
  onArrow,
  className,
  allowEditing = false,
}) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const { shortcutMode, setShortcutMode } = useKeyboardNavigationContext();
  const [isEditing, setIsEditing] = useState(false);

  // Focus the cell when selected
  useEffect(() => {
    if (cellRef.current && shortcutMode === 'cellNavigation') {
      cellRef.current.focus();
    }
  }, [shortcutMode]);

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
          onEnter();
          if (allowEditing) {
            setIsEditing(true);
            setShortcutMode('editing');
          }
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
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
      case 'ArrowRight':
        if (onArrow) {
          e.preventDefault();
          onArrow(e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right');
        }
        break;
      default:
        break;
    }
  };

  // Handle double click to enter editing mode
  const handleDoubleClick = () => {
    if (allowEditing && onEnter) {
      onEnter();
      setIsEditing(true);
      setShortcutMode('editing');
    }
  };

  return (
    <div
      ref={cellRef}
      className={className}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  );
};

export default KeyboardNavigableCell;
