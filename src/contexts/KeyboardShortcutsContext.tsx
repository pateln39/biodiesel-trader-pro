
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Remove 'selection' from shortcut modes
type ShortcutMode = 'none' | 'cellNavigation' | 'editing';

interface KeyboardShortcutsContextType {
  shortcutMode: ShortcutMode;
  setShortcutMode: (mode: ShortcutMode) => void;
  selectedRowId: string | null;
  setSelectedRowId: (id: string | null) => void;
  selectedColumnName: string | null;
  setSelectedColumnName: (name: string | null) => void;
  isEditMode: boolean;
  setIsEditMode: (isEditing: boolean) => void;
  shortcutsEnabled: boolean;
  setShortcutsEnabled: (enabled: boolean) => void;
  focusCell: (cellElement: HTMLElement | null) => void;
  currentPanel: 'left' | 'right' | null;
  setCurrentPanel: (panel: 'left' | 'right' | null) => void;
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
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [currentPanel, setCurrentPanel] = useState<'left' | 'right' | null>(null);

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
      }
    };

    document.addEventListener('mousedown', handleMouseClick);
    return () => document.removeEventListener('mousedown', handleMouseClick);
  }, [shortcutMode]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcutMode,
        setShortcutMode,
        selectedRowId,
        setSelectedRowId,
        selectedColumnName,
        setSelectedColumnName,
        isEditMode,
        setIsEditMode,
        shortcutsEnabled,
        setShortcutsEnabled,
        focusCell,
        currentPanel,
        setCurrentPanel
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};
