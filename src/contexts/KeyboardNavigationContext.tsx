
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ShortcutMode = 'editing' | 'cellNavigation' | 'none';

interface KeyboardNavigationContextType {
  shortcutMode: ShortcutMode;
  setShortcutMode: (mode: ShortcutMode) => void;
  selectedCell: { row: number; col: number } | null;
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(undefined);

export const KeyboardNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shortcutMode, setShortcutMode] = useState<ShortcutMode>('none');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  return (
    <KeyboardNavigationContext.Provider
      value={{
        shortcutMode,
        setShortcutMode,
        selectedCell,
        setSelectedCell,
      }}
    >
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export const useKeyboardNavigationContext = (): KeyboardNavigationContextType => {
  const context = useContext(KeyboardNavigationContext);
  if (context === undefined) {
    throw new Error('useKeyboardNavigationContext must be used within a KeyboardNavigationProvider');
  }
  return context;
};
