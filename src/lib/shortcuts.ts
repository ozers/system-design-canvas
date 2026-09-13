/**
 * Single source for keyboard shortcuts. Feeds the shortcuts modal (?) and the
 * command menu (⌘K). Handlers live in useKeyboardShortcuts — keep them in sync.
 * "⌘" renders as Ctrl off Apple platforms (see formatKey).
 */

export type ShortcutId =
  | 'command-menu'
  | 'shortcuts'
  | 'close'
  | 'toggle-library'
  | 'fit-view'
  | 'pan'
  | 'present'
  | 'select-all'
  | 'duplicate'
  | 'delete'
  | 'undo'
  | 'redo'
  | 'copy'
  | 'paste'
  | 'reverse-edge';

export interface Shortcut {
  id: ShortcutId;
  label: string;
  keys: string[];
}

export interface ShortcutGroup {
  name: 'Canvas' | 'Selection' | 'Editing' | 'View' | 'App';
  items: Shortcut[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: 'Canvas',
    items: [
      { id: 'toggle-library', label: 'Toggle library', keys: ['/'] },
      { id: 'pan', label: 'Pan', keys: ['Space', 'drag'] },
    ],
  },
  {
    name: 'Selection',
    items: [
      { id: 'select-all', label: 'Select all', keys: ['⌘', 'A'] },
      { id: 'duplicate', label: 'Duplicate', keys: ['⌘', 'D'] },
      { id: 'delete', label: 'Delete', keys: ['⌫'] },
    ],
  },
  {
    name: 'Editing',
    items: [
      { id: 'undo', label: 'Undo', keys: ['⌘', 'Z'] },
      { id: 'redo', label: 'Redo', keys: ['⇧', '⌘', 'Z'] },
      { id: 'copy', label: 'Copy', keys: ['⌘', 'C'] },
      { id: 'paste', label: 'Paste', keys: ['⌘', 'V'] },
      { id: 'reverse-edge', label: 'Reverse connection', keys: ['⇧', 'R'] },
    ],
  },
  {
    name: 'View',
    items: [
      { id: 'fit-view', label: 'Fit view', keys: ['F'] },
      { id: 'present', label: 'Present', keys: ['P'] },
    ],
  },
  {
    name: 'App',
    items: [
      { id: 'command-menu', label: 'Command menu', keys: ['⌘', 'K'] },
      { id: 'shortcuts', label: 'Keyboard shortcuts', keys: ['?'] },
      { id: 'close', label: 'Close panel', keys: ['esc'] },
    ],
  },
];

const BY_ID = new Map(SHORTCUT_GROUPS.flatMap((g) => g.items).map((s) => [s.id, s]));

export function getShortcutKeys(id: ShortcutId): string[] {
  return BY_ID.get(id)?.keys ?? [];
}
