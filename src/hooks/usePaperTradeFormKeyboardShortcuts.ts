
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UsePaperTradeFormKeyboardShortcutsProps {
  onAddBroker: () => void;
  onAddRow: () => void;
  onCopyPreviousRow: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  hasLegs: boolean;
}

export const usePaperTradeFormKeyboardShortcuts = ({
  onAddBroker,
  onAddRow,
  onCopyPreviousRow,
  onSubmit,
  onCancel,
  hasLegs,
}: UsePaperTradeFormKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs or textareas
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true') {
      return;
    }

    // Alt+B - Add/Toggle Broker
    if (e.altKey && e.key === 'b') {
      e.preventDefault();
      onAddBroker();
      toast.success('Broker mode toggled');
      return;
    }

    // Alt+R - Add new row
    if (e.altKey && e.key === 'r') {
      e.preventDefault();
      onAddRow();
      toast.success('New row added');
      return;
    }

    // Alt+C - Copy previous row
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      if (hasLegs) {
        onCopyPreviousRow();
        toast.success('Previous row copied');
      } else {
        toast.error('No rows to copy');
      }
      return;
    }

    // Alt+S - Save/Submit trade
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      onSubmit();
      return;
    }

    // Escape - Cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
  }, [onAddBroker, onAddRow, onCopyPreviousRow, onSubmit, onCancel, hasLegs]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
