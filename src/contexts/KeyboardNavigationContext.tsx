
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ShortcutMode = 'editing' | 'cellNavigation' | 'none';
type Panel = 'left' | 'right' | 'none';

interface CellPosition {
  row: number; // Negative for header rows, 0+ for data rows
  col: number;
  panel: Panel;
}

interface KeyboardNavigationContextType {
  shortcutMode: ShortcutMode;
  setShortcutMode: (mode: ShortcutMode) => void;
  selectedCell: CellPosition | null;
  setSelectedCell: (cell: CellPosition | null) => void;
  isEditing: boolean;
  startEditing: () => void;
  endEditing: () => void;
  handleEscape: () => void;
  handleEnter: () => void;
  clearSelection: () => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(undefined);

export const KeyboardNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shortcutMode, setShortcutMode] = useState<ShortcutMode>('none');
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setShortcutMode('editing');
  }, []);

  const endEditing = useCallback(() => {
    setIsEditing(false);
    setShortcutMode('cellNavigation');
  }, []);

  const handleEscape = useCallback(() => {
    if (isEditing) {
      setIsEditing(false);
      setShortcutMode('cellNavigation');
    } else if (shortcutMode === 'cellNavigation') {
      setShortcutMode('none');
      setSelectedCell(null);
    }
  }, [isEditing, shortcutMode]);

  const handleEnter = useCallback(() => {
    if (shortcutMode === 'cellNavigation' && selectedCell && !isEditing) {
      startEditing();
    }
  }, [shortcutMode, selectedCell, isEditing, startEditing]);

  const clearSelection = useCallback(() => {
    setSelectedCell(null);
    setShortcutMode('none');
    setIsEditing(false);
  }, []);

  return (
    <KeyboardNavigationContext.Provider
      value={{
        shortcutMode,
        setShortcutMode,
        selectedCell,
        setSelectedCell,
        isEditing,
        startEditing,
        endEditing,
        handleEscape,
        handleEnter,
        clearSelection,
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
