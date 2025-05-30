
import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseTradeEntryKeyboardShortcutsProps {
  tradeType?: string;
  setTradeType?: (type: string) => void;
  onNewTrade?: () => void;
}

export const useTradeEntryKeyboardShortcuts = ({
  tradeType,
  setTradeType,
  onNewTrade,
}: UseTradeEntryKeyboardShortcutsProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true') {
      return;
    }

    // Global shortcut: Ctrl+N for new trade
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      if (onNewTrade) {
        onNewTrade();
      } else {
        navigate('/trades/new');
      }
      return;
    }

    // Trade type switching shortcuts (only on trade entry page)
    if (location.pathname === '/trades/new' && setTradeType) {
      // Ctrl+1 for Physical Trade
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setTradeType('physical');
        return;
      }

      // Ctrl+2 for Paper Trade
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setTradeType('paper');
        return;
      }
    }
  }, [navigate, location.pathname, setTradeType, onNewTrade]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
