
import { useEffect, useCallback } from 'react';

interface UseGlobalKeyboardShortcutsProps {
  toggleSidebar: () => void;
  setSidebarFocused: (focused: boolean) => void;
  sidebarOpen: boolean;
}

export const useGlobalKeyboardShortcuts = ({
  toggleSidebar,
  setSidebarFocused,
  sidebarOpen,
}: UseGlobalKeyboardShortcutsProps) => {
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true') {
      return;
    }

    // Handle Ctrl+B to toggle sidebar
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
      
      // If opening sidebar, focus it after a brief delay
      if (!sidebarOpen) {
        setTimeout(() => {
          setSidebarFocused(true);
        }, 100);
      }
    }
  }, [toggleSidebar, setSidebarFocused, sidebarOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);
};
