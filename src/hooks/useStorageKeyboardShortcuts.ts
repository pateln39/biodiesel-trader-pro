
import { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface StorageShortcutsConfig {
  rows: { id: string }[];
  onMoveRow: (fromIndex: number, toIndex: number) => void;
  onSaveRowOrder: () => void;
  onEditCell: (rowId: string, columnName: string) => void;
  onSaveCellEdit: () => void;
  onCancelCellEdit: () => void;
  terminals: { id: string, name: string }[];
  selectedTerminalId?: string;
  onTerminalChange: (terminalId: string) => void;
  onAddTerminal: () => void;
  onAddTank: () => void;
  columnNames: string[];
  editableCellNames: string[];
}

export const useStorageKeyboardShortcuts = ({
  rows,
  onMoveRow,
  onSaveRowOrder,
  onEditCell,
  onSaveCellEdit,
  onCancelCellEdit,
  terminals,
  selectedTerminalId,
  onTerminalChange,
  onAddTerminal,
  onAddTank,
  columnNames,
  editableCellNames
}: StorageShortcutsConfig) => {
  const {
    shortcutMode,
    setShortcutMode,
    selectedRowId,
    setSelectedRowId,
    selectedCellIndex,
    setSelectedCellIndex,
    selectedColumnName,
    setSelectedColumnName,
    isEditMode,
    setIsEditMode,
    shortcutsEnabled,
    announceShortcutMode
  } = useKeyboardShortcuts();
  
  const navigate = useNavigate();
  const shortcutHandledRef = useRef(false);

  useEffect(() => {
    // Auto-select first row on page load if in selection mode
    if (shortcutMode === 'selection' && !selectedRowId && rows.length > 0) {
      setSelectedRowId(rows[0].id);
    }
  }, [shortcutMode, rows, selectedRowId, setSelectedRowId]);

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid handling the same keydown event multiple times
      if (shortcutHandledRef.current) {
        shortcutHandledRef.current = false;
        return;
      }

      // Global shortcuts (available in any mode)
      if (e.altKey && e.key === 's' && shortcutMode !== 'selection') {
        e.preventDefault();
        setShortcutMode('selection');
        if (rows.length > 0) {
          setSelectedRowId(rows[0].id);
        }
        announceShortcutMode('selection');
        shortcutHandledRef.current = true;
        return;
      }

      if (e.altKey && e.key === 't') {
        e.preventDefault();
        onAddTerminal();
        shortcutHandledRef.current = true;
        return;
      }

      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        onAddTank();
        shortcutHandledRef.current = true;
        return;
      }

      if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const currentIndex = terminals.findIndex(t => t.id === selectedTerminalId);
        if (currentIndex === -1) return;

        let newIndex;
        if (e.key === 'ArrowLeft') {
          newIndex = (currentIndex - 1 + terminals.length) % terminals.length;
        } else {
          newIndex = (currentIndex + 1) % terminals.length;
        }
        
        const newTerminalId = terminals[newIndex].id;
        onTerminalChange(newTerminalId);
        toast.info(`Switched to ${terminals[newIndex].name}`);
        shortcutHandledRef.current = true;
        return;
      }

      // Selection mode shortcuts
      if (shortcutMode === 'selection') {
        const rowIndex = selectedRowId ? rows.findIndex(row => row.id === selectedRowId) : -1;
        
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (rowIndex > 0) {
              setSelectedRowId(rows[rowIndex - 1].id);
            }
            shortcutHandledRef.current = true;
            break;
            
          case 'ArrowDown':
            e.preventDefault();
            if (rowIndex < rows.length - 1) {
              setSelectedRowId(rows[rowIndex + 1].id);
            }
            shortcutHandledRef.current = true;
            break;
            
          case 'ArrowRight':
            e.preventDefault();
            if (selectedRowId) {
              setShortcutMode('cellNavigation');
              setSelectedCellIndex(0);
              setSelectedColumnName(columnNames[0]);
              announceShortcutMode('cellNavigation');
            }
            shortcutHandledRef.current = true;
            break;
            
          case 'Enter':
            e.preventDefault();
            onSaveRowOrder();
            toast.success('Row order saved');
            shortcutHandledRef.current = true;
            break;
            
          case 'Escape':
            e.preventDefault();
            setShortcutMode('none');
            setSelectedRowId(null);
            announceShortcutMode('none');
            shortcutHandledRef.current = true;
            break;
        }
        
        // Move rows with Alt+Up/Down
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && rowIndex !== -1) {
          e.preventDefault();
          
          const newIndex = e.key === 'ArrowUp' 
            ? Math.max(0, rowIndex - 1)
            : Math.min(rows.length - 1, rowIndex + 1);
            
          if (newIndex !== rowIndex) {
            onMoveRow(rowIndex, newIndex);
            setSelectedRowId(rows[newIndex].id);
            toast.info(`Moved row ${e.key === 'ArrowUp' ? 'up' : 'down'}`);
          }
          
          shortcutHandledRef.current = true;
        }
      }
      
      // Cell navigation mode shortcuts
      else if (shortcutMode === 'cellNavigation') {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (selectedCellIndex !== null && selectedCellIndex > 0) {
              const newIndex = selectedCellIndex - 1;
              setSelectedCellIndex(newIndex);
              setSelectedColumnName(columnNames[newIndex]);
            }
            shortcutHandledRef.current = true;
            break;
            
          case 'ArrowRight':
            e.preventDefault();
            if (selectedCellIndex !== null && selectedCellIndex < columnNames.length - 1) {
              const newIndex = selectedCellIndex + 1;
              setSelectedCellIndex(newIndex);
              setSelectedColumnName(columnNames[newIndex]);
            }
            shortcutHandledRef.current = true;
            break;
            
          case 'Enter':
            e.preventDefault();
            if (selectedRowId && selectedColumnName && editableCellNames.includes(selectedColumnName)) {
              onEditCell(selectedRowId, selectedColumnName);
              setIsEditMode(true);
              setShortcutMode('editing');
              announceShortcutMode('editing');
            }
            shortcutHandledRef.current = true;
            break;
            
          case 'Escape':
            e.preventDefault();
            setShortcutMode('selection');
            setSelectedCellIndex(null);
            setSelectedColumnName(null);
            announceShortcutMode('selection');
            shortcutHandledRef.current = true;
            break;
        }
      }
      
      // Editing mode shortcuts
      else if (shortcutMode === 'editing') {
        if (e.key === 'Enter' && !e.shiftKey) {
          // Let the enter key be handled by the input for multiline inputs
          // Only capture it if it's not shift+enter
          onSaveCellEdit();
          setIsEditMode(false);
          setShortcutMode('cellNavigation');
          announceShortcutMode('cellNavigation');
          shortcutHandledRef.current = true;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancelCellEdit();
          setIsEditMode(false);
          setShortcutMode('cellNavigation');
          announceShortcutMode('cellNavigation');
          shortcutHandledRef.current = true;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    shortcutsEnabled,
    shortcutMode,
    selectedRowId,
    selectedCellIndex,
    selectedColumnName,
    rows,
    terminals,
    selectedTerminalId,
    navigate,
    isEditMode,
    setIsEditMode,
    setShortcutMode,
    setSelectedRowId,
    setSelectedCellIndex,
    setSelectedColumnName,
    editableCellNames,
    onMoveRow,
    onSaveRowOrder,
    onEditCell,
    onSaveCellEdit,
    onCancelCellEdit,
    onTerminalChange,
    onAddTerminal,
    onAddTank,
    columnNames,
    announceShortcutMode
  ]);

  // Return some useful utilities
  return {
    getRowClassName: (rowId: string) => {
      return selectedRowId === rowId && shortcutMode === 'selection'
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
      selectedRowId === rowId && selectedColumnName === columnName
  };
};
