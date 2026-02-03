"use client"

// ============================================
// SOLVE IT! - Keyboard Shortcuts Hook
// ============================================

import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onNew?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Ctrl/Cmd
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    if (!isCtrlOrCmd) return;

    switch (e.key.toLowerCase()) {
      case 's':
        // Ctrl+S = Save
        e.preventDefault();
        handlers.onSave?.();
        break;
      
      case 'e':
        // Ctrl+E = Export
        e.preventDefault();
        handlers.onExport?.();
        break;
      
      case 'z':
        // Ctrl+Z = Undo, Ctrl+Shift+Z = Redo
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onRedo?.();
        } else {
          handlers.onUndo?.();
        }
        break;
      
      case 'y':
        // Ctrl+Y = Redo
        e.preventDefault();
        handlers.onRedo?.();
        break;
      
      case 'n':
        // Ctrl+N = New
        e.preventDefault();
        handlers.onNew?.();
        break;
      
      case 'k':
      case 'f':
        // Ctrl+K or Ctrl+F = Search
        e.preventDefault();
        handlers.onSearch?.();
        break;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Shortcut hints for UI
export const SHORTCUTS = {
  save: { key: 'Ctrl+S', label: 'Save' },
  export: { key: 'Ctrl+E', label: 'Export' },
  undo: { key: 'Ctrl+Z', label: 'Undo' },
  redo: { key: 'Ctrl+Y', label: 'Redo' },
  new: { key: 'Ctrl+N', label: 'New' },
  search: { key: 'Ctrl+K', label: 'Search' },
};
