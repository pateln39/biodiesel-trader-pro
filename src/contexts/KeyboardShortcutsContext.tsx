import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

type ShortcutMode = 'none' | 'selection' | 'cellNavigation' | 'editing';

interface KeyboardShortcutsContextType {
  shortcutMode: ShortcutMode;
  setShortcutMode: (mode: ShortcutMode) => void;
  selectedRowId: string | null;
  setSelectedRowId: (id: string | null) => void;
  selectedCellIndex: number | null;
  setSelectedCellIndex: (index: number | null) => void;
  selectedColumnName: string | null;
  setSelectedColumnName: (name: string | null) => void;
  isEditMode: boolean;
  setIsEditMode: (isEditing: boolean) => void;
  shortcutsEnabled: boolean;
  setShortcutsEnabled: (enabled: boolean) => void;
  announceShortcutMode: (mode: ShortcutMode) => void;
  focusCell: (cellElement: HTMLElement | null) => void;
}

export const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
};

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({ children }) => {
  const [shortcutMode, setShortcutMode] = useState<ShortcutMode>('none');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  const focusCell = (cellElement: HTMLElement | null) => {
    if (cellElement) {
      cellElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest'
      });
      cellElement.focus();
    }
  };

  useEffect(() => {
    const handleMouseClick = () => {
      if (shortcutMode !== 'none' && shortcutMode !== 'editing') {
        setShortcutMode('none');
        setSelectedRowId(null);
        setSelectedColumnName(null);
        setSelectedCellIndex(null);
      }
    };

    document.addEventListener('mousedown', handleMouseClick);
    return () => document.removeEventListener('mousedown', handleMouseClick);
  }, [shortcutMode]);

  const announceShortcutMode = (mode: ShortcutMode) => {
    switch (mode) {
      case 'selection':
        toast.info('Selection Mode', { description: 'Use arrow keys to navigate rows, Alt+Up/Down to move rows, Enter to save' });
        break;
      case 'cellNavigation':
        toast.info('Cell Navigation Mode', { description: 'Use arrow keys to navigate cells, Enter to edit' });
        break;
      case 'editing':
        toast.info('Editing Mode', { description: 'Enter to save, Escape to cancel' });
        break;
      case 'none':
        toast.info('Normal Mode', { description: 'Alt+S for selection mode' });
        break;
    }
  };

  return (
    <KeyboardShortcutsContext.Provider
      value={{
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
        setShortcutsEnabled,
        announceShortcutMode,
        focusCell
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};
