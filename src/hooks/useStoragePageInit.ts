
import { useEffect } from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

export const useStoragePageInit = (movements: any[]) => {
  const {
    setShortcutMode,
    setSelectedRowId,
    setSelectedColumnName,
    shortcutMode,
    focusCell
  } = useKeyboardShortcuts();

  useEffect(() => {
    // Initialize keyboard navigation when page loads and there are movements
    if (movements.length > 0 && shortcutMode === 'none') {
      setShortcutMode('cellNavigation');
      setSelectedRowId(movements[0].assignment_id);
      setSelectedColumnName('counterparty');
      
      // Focus the first cell
      setTimeout(() => {
        const firstCell = document.querySelector(
          `[data-row-id="${movements[0].assignment_id}"][data-column-name="counterparty"]`
        ) as HTMLElement;
        focusCell(firstCell);
      }, 100);
    }
  }, [movements]);

  // Handle arrow keys in normal mode
  useEffect(() => {
    const handleNormalModeNavigation = (e: KeyboardEvent) => {
      if (shortcutMode === 'none' && movements.length > 0) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          setShortcutMode('cellNavigation');
          setSelectedRowId(movements[0].assignment_id);
          setSelectedColumnName('counterparty');
          
          const firstCell = document.querySelector(
            `[data-row-id="${movements[0].assignment_id}"][data-column-name="counterparty"]`
          ) as HTMLElement;
          focusCell(firstCell);
        }
      }
    };

    document.addEventListener('keydown', handleNormalModeNavigation);
    return () => document.removeEventListener('keydown', handleNormalModeNavigation);
  }, [shortcutMode, movements]);
};
