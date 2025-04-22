
import React from 'react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

interface KeyboardNavigableCellProps {
  rowId: string;
  columnName: string;
  children: React.ReactNode;
  className?: string;
  onEdit?: () => void;
  panel: 'left' | 'right';
}

const KeyboardNavigableCell: React.FC<KeyboardNavigableCellProps> = ({
  rowId,
  columnName,
  children,
  className,
  onEdit,
  panel
}) => {
  const { 
    shortcutMode, 
    selectedRowId, 
    selectedColumnName,
    setShortcutMode,
    setSelectedRowId,
    setSelectedColumnName,
    setIsEditMode,
    setCurrentPanel
  } = useKeyboardShortcuts();

  const isSelected = selectedRowId === rowId && selectedColumnName === columnName;
  
  const handleClick = () => {
    // Use type-safe checks for shortcut mode
    if (shortcutMode === 'none' || shortcutMode === 'cellNavigation') {
      setShortcutMode('cellNavigation');
      setSelectedRowId(rowId);
      setSelectedColumnName(columnName);
      setCurrentPanel(panel);
    } else if (shortcutMode === 'cellNavigation' && isSelected && onEdit) {
      onEdit();
      setShortcutMode('editing');
      setIsEditMode(true);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        className,
        isSelected && shortcutMode === 'cellNavigation' 
          ? 'outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]' 
          : ''
      )}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      data-row-id={rowId}
      data-column-name={columnName}
      data-panel={panel}
    >
      {children}
    </div>
  );
};

export default KeyboardNavigableCell;
