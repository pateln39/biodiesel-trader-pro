
import React from 'react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

interface KeyboardNavigableCellProps {
  rowId: string;
  columnName: string;
  children: React.ReactNode;
  className?: string;
  onEdit?: () => void;
}

const KeyboardNavigableCell: React.FC<KeyboardNavigableCellProps> = ({
  rowId,
  columnName,
  children,
  className,
  onEdit
}) => {
  const { 
    shortcutMode, 
    selectedRowId, 
    selectedColumnName,
    setShortcutMode,
    setSelectedRowId,
    setSelectedCellIndex,
    setSelectedColumnName,
    setIsEditMode,
    announceShortcutMode
  } = useKeyboardShortcuts();

  const isSelected = selectedRowId === rowId && selectedColumnName === columnName;
  
  const handleClick = () => {
    if (shortcutMode === 'none' || shortcutMode === 'selection') {
      setShortcutMode('cellNavigation');
      setSelectedRowId(rowId);
      setSelectedColumnName(columnName);
      announceShortcutMode('cellNavigation');
    } else if (shortcutMode === 'cellNavigation' && isSelected && onEdit) {
      onEdit();
      setShortcutMode('editing');
      setIsEditMode(true);
      announceShortcutMode('editing');
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
    >
      {children}
    </div>
  );
};

export default KeyboardNavigableCell;
