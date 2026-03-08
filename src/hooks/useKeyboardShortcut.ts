// ============================================================================
// KEYBOARD SHORTCUT HOOK
// Provides keyboard shortcut functionality throughout the admin panel
// ============================================================================

import { useEffect, useCallback } from 'react';

export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';
export type KeyCombo = {
  key: string;
  modifiers?: ModifierKey[];
};

interface UseKeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 *
 * @param keyCombo - Key combination (e.g., { key: 's', modifiers: ['ctrl'] })
 * @param callback - Function to call when shortcut is triggered
 * @param options - Additional options
 *
 * @example
 * useKeyboardShortcut({ key: 's', modifiers: ['ctrl'] }, handleSave);
 * useKeyboardShortcut({ key: 'Escape' }, handleClose);
 */
export function useKeyboardShortcut(
  keyCombo: KeyCombo,
  callback: () => void,
  options: UseKeyboardShortcutOptions = {}
) {
  const { enabled = true, preventDefault = true, stopPropagation = false } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key, modifiers = [] } = keyCombo;

      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      if (!keyMatches) return;

      // Check if modifiers match
      const ctrlMatch = modifiers.includes('ctrl') ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey;
      const altMatch = modifiers.includes('alt') ? event.altKey : !event.altKey;
      const metaMatch = modifiers.includes('meta') ? event.metaKey : !event.metaKey;

      if (ctrlMatch && shiftMatch && altMatch && metaMatch) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        callback();
      }
    },
    [keyCombo, callback, enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Predefined shortcuts for common actions
 */
export const SHORTCUTS = {
  save: { key: 's', modifiers: ['ctrl'] as ModifierKey[] },
  undo: { key: 'z', modifiers: ['ctrl'] as ModifierKey[] },
  redo: { key: 'y', modifiers: ['ctrl'] as ModifierKey[] },
  delete: { key: 'Delete' },
  escape: { key: 'Escape' },
  enter: { key: 'Enter' },
  find: { key: 'f', modifiers: ['ctrl'] as ModifierKey[] },
  selectAll: { key: 'a', modifiers: ['ctrl'] as ModifierKey[] },
  copy: { key: 'c', modifiers: ['ctrl'] as ModifierKey[] },
  paste: { key: 'v', modifiers: ['ctrl'] as ModifierKey[] },
  duplicate: { key: 'd', modifiers: ['ctrl'] as ModifierKey[] },
  newItem: { key: 'n', modifiers: ['ctrl'] as ModifierKey[] },
};

/**
 * Format key combo for display
 */
export function formatKeyCombo(keyCombo: KeyCombo): string {
  const { key, modifiers = [] } = keyCombo;
  const parts: string[] = [];

  if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (modifiers.includes('shift')) {
    parts.push('⇧');
  }
  if (modifiers.includes('alt')) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }

  parts.push(key.toUpperCase());

  return parts.join('+');
}
