'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function useKeyboardShortcuts() {
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const copyNode = useCanvasStore((s) => s.copyNode);
  const pasteNode = useCanvasStore((s) => s.pasteNode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Copy: Ctrl/Cmd + C
      if (isMod && e.key === 'c') {
        e.preventDefault();
        copyNode();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (isMod && e.key === 'v') {
        e.preventDefault();
        pasteNode();
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if (isMod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((isMod && e.shiftKey && e.key === 'z') || (isMod && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Escape: deselect
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setSelectedNodeId, copyNode, pasteNode]);
}
