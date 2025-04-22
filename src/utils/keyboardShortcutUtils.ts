
import { ShortcutConfig } from '@/context/KeyboardShortcutsContext';

/**
 * Formats a keyboard shortcut into a user-friendly string
 */
export const formatShortcut = (shortcut: ShortcutConfig): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('⌘');
  
  // Format the key to be more readable
  let key = shortcut.key;
  
  // Replace with symbols for special keys
  switch (key.toLowerCase()) {
    case 'arrowup': key = '↑'; break;
    case 'arrowdown': key = '↓'; break;
    case 'arrowleft': key = '←'; break;
    case 'arrowright': key = '→'; break;
    case 'enter': key = '↵'; break;
    case 'escape': key = 'Esc'; break;
    case 'tab': key = '↹'; break;
    case ' ': key = 'Space'; break;
    default:
      // Capitalize single letters
      if (key.length === 1) {
        key = key.toUpperCase();
      }
  }
  
  parts.push(key);
  
  return parts.join(' + ');
};

/**
 * Get relevant shortcuts for the current page
 */
export const getShortcutsForPage = (shortcuts: Record<string, ShortcutConfig>, page: string): ShortcutConfig[] => {
  return Object.values(shortcuts).filter(shortcut => 
    !shortcut.scope || shortcut.scope === 'global' || shortcut.scope === page
  );
};

/**
 * Groups shortcuts by category
 */
export const groupShortcutsByCategory = (shortcuts: ShortcutConfig[]): Record<string, ShortcutConfig[]> => {
  const groups: Record<string, ShortcutConfig[]> = {
    'Global': [],
    'Navigation': [],
    'Editing': [],
    'Tables': [],
    'Other': []
  };
  
  shortcuts.forEach(shortcut => {
    const scope = shortcut.scope || 'Other';
    
    if (scope === 'global') {
      groups['Global'].push(shortcut);
    } else if (scope.includes('nav')) {
      groups['Navigation'].push(shortcut);
    } else if (scope.includes('edit') || scope.includes('form')) {
      groups['Editing'].push(shortcut);
    } else if (scope.includes('table') || scope.includes('cell')) {
      groups['Tables'].push(shortcut);
    } else {
      groups['Other'].push(shortcut);
    }
  });
  
  // Remove empty categories
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });
  
  return groups;
};
