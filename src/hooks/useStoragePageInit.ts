
import { useEffect } from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

export const useStoragePageInit = (movements: any[]) => {
  const {
    setShortcutMode,
    setSelectedRowId,
    setSelectedColumnName,
    shortcutMode,
    setCurrentPanel
  } = useKeyboardShortcuts();

  useEffect(() => {
    // Initialize keyboard navigation when page loads and there are movements
    if (movements.length > 0 && shortcutMode === 'none') {
      setSelectedRowId(movements[0].assignment_id);
      setSelectedColumnName('counterparty');
      setCurrentPanel('left');
      setShortcutMode('cellNavigation');
    }
  }, [movements]);
};
