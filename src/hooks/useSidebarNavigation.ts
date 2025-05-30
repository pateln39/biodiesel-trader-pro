import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type FlatMenuItem = {
  id: string;
  type: 'link' | 'submenu-toggle';
  path?: string;
  label: string;
  parentLabel?: string;
  action: () => void;
  isVisible: boolean;
};

interface UseSidebarNavigationProps {
  sidebarOpen: boolean;
  riskSubmenuOpen: boolean;
  operationsSubmenuOpen: boolean;
  toggleRiskSubmenu: () => void;
  toggleOperationsSubmenu: () => void;
}

export const useSidebarNavigation = ({
  sidebarOpen,
  riskSubmenuOpen,
  operationsSubmenuOpen,
  toggleRiskSubmenu,
  toggleOperationsSubmenu,
}: UseSidebarNavigationProps) => {
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const [sidebarFocused, setSidebarFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Create flattened menu structure
  const createFlatMenuItems = useCallback((): FlatMenuItem[] => {
    const items: FlatMenuItem[] = [
      {
        id: 'dashboard',
        type: 'link',
        path: '/',
        label: 'Dashboard',
        action: () => navigate('/'),
        isVisible: true,
      },
      {
        id: 'trades',
        type: 'link',
        path: '/trades',
        label: 'Trade Entry',
        action: () => navigate('/trades'),
        isVisible: true,
      },
      {
        id: 'operations-toggle',
        type: 'submenu-toggle',
        label: 'Operations',
        action: toggleOperationsSubmenu,
        isVisible: true,
      },
    ];

    // Add operations submenu items if open
    if (operationsSubmenuOpen) {
      items.push(
        {
          id: 'open-trades',
          type: 'link',
          path: '/operations/open-trades',
          label: 'Open Trades',
          parentLabel: 'Operations',
          action: () => navigate('/operations/open-trades'),
          isVisible: true,
        },
        {
          id: 'movements',
          type: 'link',
          path: '/operations/movements',
          label: 'Movements',
          parentLabel: 'Operations',
          action: () => navigate('/operations/movements'),
          isVisible: true,
        },
        {
          id: 'storage',
          type: 'link',
          path: '/operations/storage',
          label: 'Storage',
          parentLabel: 'Operations',
          action: () => navigate('/operations/storage'),
          isVisible: true,
        },
        {
          id: 'demurrage',
          type: 'link',
          path: '/operations/demurrage',
          label: 'Demurrage',
          parentLabel: 'Operations',
          action: () => navigate('/operations/demurrage'),
          isVisible: true,
        }
      );
    }

    // Add risk toggle
    items.push({
      id: 'risk-toggle',
      type: 'submenu-toggle',
      label: 'Risk',
      action: toggleRiskSubmenu,
      isVisible: true,
    });

    // Add risk submenu items if open
    if (riskSubmenuOpen) {
      items.push(
        {
          id: 'mtm',
          type: 'link',
          path: '/risk/mtm',
          label: 'MTM',
          parentLabel: 'Risk',
          action: () => navigate('/risk/mtm'),
          isVisible: true,
        },
        {
          id: 'pnl',
          type: 'link',
          path: '/risk/pnl',
          label: 'PNL',
          parentLabel: 'Risk',
          action: () => navigate('/risk/pnl'),
          isVisible: true,
        },
        {
          id: 'exposure',
          type: 'link',
          path: '/risk/exposure',
          label: 'Exposure',
          parentLabel: 'Risk',
          action: () => navigate('/risk/exposure'),
          isVisible: true,
        },
        {
          id: 'prices',
          type: 'link',
          path: '/risk/prices',
          label: 'Prices',
          parentLabel: 'Risk',
          action: () => navigate('/risk/prices'),
          isVisible: true,
        },
        {
          id: 'inventory-mtm',
          type: 'link',
          path: '/risk/inventory-mtm',
          label: 'Inventory (MTM)',
          parentLabel: 'Risk',
          action: () => navigate('/risk/inventory-mtm'),
          isVisible: true,
        }
      );
    }

    // Add audit log
    items.push({
      id: 'audit',
      type: 'link',
      path: '/audit',
      label: 'Audit Log',
      action: () => navigate('/audit'),
      isVisible: true,
    });

    return items.filter(item => item.isVisible);
  }, [navigate, operationsSubmenuOpen, riskSubmenuOpen, toggleOperationsSubmenu, toggleRiskSubmenu]);

  const flatMenuItems = createFlatMenuItems();

  // Enhanced setSidebarFocused function to reset focus to first item
  const setSidebarFocusedWithReset = useCallback((focused: boolean) => {
    setSidebarFocused(focused);
    if (focused && flatMenuItems.length > 0) {
      setFocusedItemIndex(0);
    } else if (!focused) {
      setFocusedItemIndex(-1);
    }
  }, [flatMenuItems.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!sidebarFocused || !sidebarOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedItemIndex(prev => 
          prev < flatMenuItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedItemIndex(prev => 
          prev > 0 ? prev - 1 : flatMenuItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedItemIndex >= 0 && focusedItemIndex < flatMenuItems.length) {
          flatMenuItems[focusedItemIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSidebarFocused(false);
        setFocusedItemIndex(-1);
        break;
    }
  }, [sidebarFocused, sidebarOpen, flatMenuItems, focusedItemIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset focus when sidebar closes
  useEffect(() => {
    if (!sidebarOpen) {
      setSidebarFocused(false);
      setFocusedItemIndex(-1);
    }
  }, [sidebarOpen]);

  // Reset focused index when menu structure changes
  useEffect(() => {
    setFocusedItemIndex(-1);
  }, [operationsSubmenuOpen, riskSubmenuOpen]);

  return {
    focusedItemIndex,
    sidebarFocused,
    setSidebarFocused: setSidebarFocusedWithReset,
    flatMenuItems,
  };
};
