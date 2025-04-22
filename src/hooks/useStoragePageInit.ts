
import { useEffect } from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

export const useStoragePageInit = (movements: any[]) => {
  const {
    setShortcutMode,
    setSelectedRowId,
    setSelectedColumnName,
    announceShortcutMode,
    shortcutMode
  } = useKeyboardShortcuts();

  useEffect(() => {
    // Initialize keyboard navigation when page loads and there are movements
    if (movements.length > 0 && shortcutMode === 'none') {
      setShortcutMode('selection');
      setSelectedRowId(movements[0].assignment_id);
      setSelectedColumnName('counterparty');
      announceShortcutMode('selection');
    }
  }, [movements]);
};
