
import { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

interface StorageShortcutsConfig {
  rows: { id: string }[];
  onEditCell: (rowId: string, columnName: string) => void;
  onSaveCellEdit: () => void;
  onCancelCellEdit: () => void;
  terminals: { id: string, name: string }[];
  selectedTerminalId?: string;
  onTerminalChange: (terminalId: string) => void;
  onAddTerminal: () => void;
  onAddTank: () => void;
  leftPanelColumns: string[];
  rightPanelColumns: string[];
  editableCellNames: string[];
}

export const useStorageKeyboardShortcuts = ({
  rows,
  onEditCell,
  onSaveCellEdit,
  onCancelCellEdit,
  terminals,
  selectedTerminalId,
  onTerminalChange,
  onAddTerminal,
  onAddTank,
  leftPanelColumns,
  rightPanelColumns,
  editableCellNames
}: StorageShortcutsConfig) => {
  const {
    shortcutMode,
    setShortcutMode,
    selectedRowId,
    setSelectedRowId,
    selectedColumnName,
    setSelectedColumnName,
    isEditMode,
    setIsEditMode,
    shortcutsEnabled,
    focusCell,
    currentPanel,
    setCurrentPanel
  } = useKeyboardShortcuts();
  
  const shortcutHandledRef = useRef(false);

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shortcutHandledRef.current) {
        shortcutHandledRef.current = false;
        return;
      }

      // Prevent default arrow key scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }

      // Handle normal mode arrow keys
      if (shortcutMode === 'none' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setShortcutMode('cellNavigation');
        setSelectedRowId(rows[0].id);
        setSelectedColumnName(leftPanelColumns[0]);
        setCurrentPanel('left');
        shortcutHandledRef.current = true;
        return;
      }

      // Cell navigation mode
      if (shortcutMode === 'cellNavigation') {
        const currentColumns = currentPanel === 'left' ? leftPanelColumns : rightPanelColumns;
        const rowIndex = rows.findIndex(row => row.id === selectedRowId);
        const columnIndex = currentColumns.indexOf(selectedColumnName || '');
        
        switch (e.key) {
          case 'ArrowLeft':
            if (columnIndex > 0) {
              const newColumnName = currentColumns[columnIndex - 1];
              setSelectedColumnName(newColumnName);
            } else if (currentPanel === 'right') {
              setCurrentPanel('left');
              setSelectedColumnName(leftPanelColumns[leftPanelColumns.length - 1]);
            }
            break;
            
          case 'ArrowRight':
            if (columnIndex < currentColumns.length - 1) {
              const newColumnName = currentColumns[columnIndex + 1];
              setSelectedColumnName(newColumnName);
            } else if (currentPanel === 'left' && selectedColumnName === 'quantity') {
              setCurrentPanel('right');
              setSelectedColumnName(rightPanelColumns[0]);
            }
            break;
            
          case 'ArrowUp':
            if (rowIndex > 0) {
              setSelectedRowId(rows[rowIndex - 1].id);
            }
            break;
            
          case 'ArrowDown':
            if (rowIndex < rows.length - 1) {
              setSelectedRowId(rows[rowIndex + 1].id);
            }
            break;
            
          case 'Enter':
            if (selectedRowId && selectedColumnName && editableCellNames.includes(selectedColumnName)) {
              onEditCell(selectedRowId, selectedColumnName);
              setIsEditMode(true);
              setShortcutMode('editing');
            }
            break;
            
          case 'Escape':
            setShortcutMode('none');
            setSelectedRowId(null);
            setSelectedColumnName(null);
            setCurrentPanel(null);
            break;
        }

        // Focus the cell after navigation
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          const cellElement = document.querySelector(
            `[data-row-id="${selectedRowId}"][data-column-name="${selectedColumnName}"][data-panel="${currentPanel}"]`
          ) as HTMLElement;
          
          if (cellElement) {
            focusCell(cellElement);
          }
        }

        shortcutHandledRef.current = true;
      }
      
      // Editing mode shortcuts
      else if (shortcutMode === 'editing') {
        if (e.key === 'Enter' && !e.shiftKey) {
          onSaveCellEdit();
          setIsEditMode(false);
          setShortcutMode('cellNavigation');
        } else if (e.key === 'Escape') {
          onCancelCellEdit();
          setIsEditMode(false);
          setShortcutMode('cellNavigation');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcutsEnabled,
    shortcutMode,
    selectedRowId,
    selectedColumnName,
    rows,
    terminals,
    selectedTerminalId,
    isEditMode,
    currentPanel,
    leftPanelColumns,
    rightPanelColumns
  ]);

  // Update Input component to add focus styling
  const getFocusClassName = () => {
    return 'focus:outline-2 focus:outline-brand-lime focus:ring-2 focus:ring-brand-lime focus:shadow-[0_0_15px_rgba(180,211,53,0.7)]';
  };

  return {
    getRowClassName: (rowId: string) => {
      return selectedRowId === rowId && shortcutMode === 'cellNavigation'
        ? 'outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]'
        : '';
    },
    getCellClassName: (rowId: string, columnName: string) => {
      return selectedRowId === rowId && 
             selectedColumnName === columnName && 
             shortcutMode === 'cellNavigation'
        ? 'outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]'
        : '';
    },
    isRowSelected: (rowId: string) => selectedRowId === rowId,
    isCellSelected: (rowId: string, columnName: string) => 
      selectedRowId === rowId && selectedColumnName === columnName,
    getFocusClassName
  };
};
