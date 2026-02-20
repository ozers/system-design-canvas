'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function useKeyboardShortcuts() {
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const copySelection = useCanvasStore((s) => s.copySelection);
  const pasteSelection = useCanvasStore((s) => s.pasteSelection);
  const selectAll = useCanvasStore((s) => s.selectAll);
  const presentationMode = useCanvasStore((s) => s.presentationMode);
  const togglePresentationMode = useCanvasStore((s) => s.togglePresentationMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Select All: Ctrl/Cmd + A
      if (isMod && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (isMod && e.key === 'c') {
        e.preventDefault();
        copySelection();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (isMod && e.key === 'v') {
        e.preventDefault();
        pasteSelection();
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

      // Presentation mode: P to toggle, Escape to exit
      if (e.key === 'p' && !isMod) {
        togglePresentationMode();
        return;
      }

      // Escape: exit presentation mode or deselect
      if (e.key === 'Escape') {
        if (presentationMode) {
          togglePresentationMode();
        } else {
          setSelectedNodeId(null);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setSelectedNodeId, copySelection, pasteSelection, selectAll, presentationMode, togglePresentationMode]);
}
