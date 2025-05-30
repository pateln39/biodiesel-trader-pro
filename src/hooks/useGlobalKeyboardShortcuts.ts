
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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

    // Handle Alt+S to focus sidebar (only if sidebar is already open)
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      if (sidebarOpen) {
        setSidebarFocused(true);
      }
    }

    // Handle Ctrl+N to create new trade (global shortcut)
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      navigate('/trades/new');
    }
  }, [toggleSidebar, setSidebarFocused, sidebarOpen, navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);
};
