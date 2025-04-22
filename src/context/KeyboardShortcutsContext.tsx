
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type ShortcutAction = () => void;

export interface ShortcutConfig {
  key: string;
  description: string;
  action: ShortcutAction;
  scope?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  enabled?: boolean;
}

interface KeyboardShortcutsContextType {
  registerShortcut: (id: string, config: ShortcutConfig) => void;
  unregisterShortcut: (id: string) => void;
  getShortcuts: () => Record<string, ShortcutConfig>;
  isShortcutGuideOpen: boolean;
  setShortcutGuideOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const KeyboardShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<Record<string, ShortcutConfig>>({});
  const [isShortcutGuideOpen, setShortcutGuideOpen] = useState(false);
  const location = useLocation();

  // Update shortcuts when the location changes
  useEffect(() => {
    // This is where we could modify shortcuts based on the current route
    console.log('Route changed:', location.pathname);
  }, [location]);

  // Global event listener for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on an input, textarea, or select
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isEditable = 
        tagName === 'input' || 
        tagName === 'textarea' || 
        tagName === 'select' ||
        target.isContentEditable;

      // Don't trigger shortcuts if user is typing in a form field
      // unless the shortcut is specifically designed for form fields
      if (isEditable && !e.key.startsWith('Escape') && !e.key.startsWith('Enter')) {
        return;
      }

      // Check for shortcut guide toggle (? or F1)
      if ((e.key === '?' && e.shiftKey) || e.key === 'F1') {
        e.preventDefault();
        setShortcutGuideOpen(prev => !prev);
        return;
      }

      // Check for matching shortcuts
      for (const id in shortcuts) {
        const shortcut = shortcuts[id];
        
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Check if key and modifiers match
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrl === e.ctrlKey;
        const altMatches = !!shortcut.alt === e.altKey;
        const shiftMatches = !!shortcut.shift === e.shiftKey;
        const metaMatches = !!shortcut.meta === e.metaKey;
        
        if (
          keyMatches && 
          ctrlMatches && 
          altMatches && 
          shiftMatches && 
          metaMatches
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.addEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);

  const registerShortcut = (id: string, config: ShortcutConfig) => {
    setShortcuts(prev => ({
      ...prev,
      [id]: { enabled: true, ...config }
    }));
  };

  const unregisterShortcut = (id: string) => {
    setShortcuts(prev => {
      const newShortcuts = { ...prev };
      delete newShortcuts[id];
      return newShortcuts;
    });
  };

  const getShortcuts = () => {
    return shortcuts;
  };

  return (
    <KeyboardShortcutsContext.Provider value={{ 
      registerShortcut, 
      unregisterShortcut, 
      getShortcuts,
      isShortcutGuideOpen,
      setShortcutGuideOpen
    }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
};
