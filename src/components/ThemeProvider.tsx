
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Register global keyboard shortcuts
  useEffect(() => {
    // Navigation shortcuts
    registerShortcut('nav-operations', {
      key: '1',
      alt: true,
      description: 'Go to Operations',
      action: () => navigate('/operations'),
      scope: 'global'
    });
    
    registerShortcut('nav-trades', {
      key: '2',
      alt: true,
      description: 'Go to Trades',
      action: () => navigate('/trades'),
      scope: 'global'
    });
    
    registerShortcut('nav-risk', {
      key: '3',
      alt: true,
      description: 'Go to Risk',
      action: () => navigate('/risk'),
      scope: 'global'
    });
    
    registerShortcut('nav-pricing', {
      key: '4',
      alt: true,
      description: 'Go to Pricing',
      action: () => navigate('/pricing'),
      scope: 'global'
    });
    
    // Operations sub-pages
    if (location.pathname.includes('/operations')) {
      registerShortcut('nav-storage', {
        key: 's',
        alt: true,
        description: 'Go to Storage',
        action: () => navigate('/operations/storage'),
        scope: 'operations'
      });
      
      registerShortcut('nav-movements', {
        key: 'm',
        alt: true,
        description: 'Go to Movements',
        action: () => navigate('/operations'),
        scope: 'operations'
      });
    }
    
    return () => {
      unregisterShortcut('nav-operations');
      unregisterShortcut('nav-trades');
      unregisterShortcut('nav-risk');
      unregisterShortcut('nav-pricing');
      
      unregisterShortcut('nav-storage');
      unregisterShortcut('nav-movements');
    };
  }, [location.pathname, navigate, registerShortcut, unregisterShortcut]);
  
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
