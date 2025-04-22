
import { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

interface StorageShortcutsConfig {
  rows: { id: string }[];
  terminals: { id: string, name: string }[];
  selectedTerminalId?: string;
  onTerminalChange: (terminalId: string) => void;
  onAddTerminal: () => void;
  onAddTank: () => void;
  columnNames: string[];
  rightPanelColumnNames: string[];
  editableCellNames: string[];
}

export const useStorageKeyboardShortcuts = ({
  rows,
  terminals,
  selectedTerminalId,
  onTerminalChange,
  onAddTerminal,
  onAddTank,
  columnNames,
  rightPanelColumnNames,
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
    shortcutsEnabled,
    focusCell
  } = useKeyboardShortcuts();
  
  const shortcutHandledRef = useRef(false);

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shortcutHandledRef.current || isEditMode) {
        shortcutHandledRef.current = false;
        return;
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }

      if (shortcutMode === 'cellNavigation') {
        const rowIndex = selectedRowId ? rows.findIndex(row => row.id === selectedRowId) : -1;
        const isInLeftPanel = columnNames.includes(selectedColumnName || '');
        const isInRightPanel = rightPanelColumnNames.includes(selectedColumnName || '');
        const currentColumnIndex = isInLeftPanel 
          ? columnNames.indexOf(selectedColumnName || '')
          : rightPanelColumnNames.indexOf(selectedColumnName || '');

        switch (e.key) {
          case 'ArrowLeft': {
            e.preventDefault();
            if (isInRightPanel && currentColumnIndex === 0) {
              // Move from first right panel column to last left panel column
              setSelectedColumnName(columnNames[columnNames.length - 1]);
            } else if (isInRightPanel && currentColumnIndex > 0) {
              setSelectedColumnName(rightPanelColumnNames[currentColumnIndex - 1]);
            } else if (isInLeftPanel && currentColumnIndex > 0) {
              setSelectedColumnName(columnNames[currentColumnIndex - 1]);
            }
            break;
          }
          
          case 'ArrowRight': {
            e.preventDefault();
            if (isInLeftPanel && currentColumnIndex === columnNames.length - 1) {
              // Move from last left panel column to first right panel column
              setSelectedColumnName(rightPanelColumnNames[0]);
            } else if (isInLeftPanel && currentColumnIndex < columnNames.length - 1) {
              setSelectedColumnName(columnNames[currentColumnIndex + 1]);
            } else if (isInRightPanel && currentColumnIndex < rightPanelColumnNames.length - 1) {
              setSelectedColumnName(rightPanelColumnNames[currentColumnIndex + 1]);
            }
            break;
          }
          
          case 'ArrowUp': {
            e.preventDefault();
            if (rowIndex > 0) {
              setSelectedRowId(rows[rowIndex - 1].id);
            }
            break;
          }
          
          case 'ArrowDown': {
            e.preventDefault();
            if (rowIndex < rows.length - 1) {
              setSelectedRowId(rows[rowIndex + 1].id);
            }
            break;
          }
        }

        // After any navigation, focus the new cell
        setTimeout(() => {
          const cell = document.querySelector(
            `[data-row-id="${selectedRowId}"][data-column-name="${selectedColumnName}"]`
          ) as HTMLElement;
          focusCell(cell);
        }, 0);
      }

      shortcutHandledRef.current = true;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    shortcutsEnabled,
    shortcutMode,
    selectedRowId,
    selectedColumnName,
    rows,
    columnNames,
    rightPanelColumnNames,
    isEditMode
  ]);

  // Update form field styling for tab navigation
  useEffect(() => {
    const handleTabFocus = () => {
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.tagName === 'TEXTAREA'
      )) {
        activeElement.classList.add('outline-brand-lime', 'outline-1', 'outline');
      }
    };

    const handleTabBlur = () => {
      const elements = document.querySelectorAll('.outline-brand-lime');
      elements.forEach(element => {
        element.classList.remove('outline-brand-lime', 'outline-1', 'outline');
      });
    };

    document.addEventListener('focus', handleTabFocus, true);
    document.addEventListener('blur', handleTabBlur, true);

    return () => {
      document.removeEventListener('focus', handleTabFocus, true);
      document.removeEventListener('blur', handleTabBlur, true);
    };
  }, []);

  return {
    getCellClassName: (rowId: string, columnName: string) => {
      return selectedRowId === rowId && 
             selectedColumnName === columnName && 
             shortcutMode === 'cellNavigation'
        ? 'outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]'
        : '';
    },
    isCellSelected: (rowId: string, columnName: string) => 
      selectedRowId === rowId && selectedColumnName === columnName
  };
};
