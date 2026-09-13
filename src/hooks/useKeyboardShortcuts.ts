'use client';

import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';

import { getFitViewOptions } from '@/components/canvas/canvas-helpers';
function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
}

/** A Radix dialog/sheet or menu is open — it owns the keyboard. */
function isOverlayOpen() {
  return !!document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"]'
  );
}

/**
 * Global canvas shortcuts. Keep in sync with SHORTCUT_GROUPS in `src/lib/shortcuts.ts`.
 * Delete/Backspace is handled by React Flow's deleteKeyCode; Space-drag pan by React Flow.
 * Presentation arrows live in PresentationOverlay.
 */
export function useKeyboardShortcuts() {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = useCanvasStore.getState();
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // ⌘K works everywhere, including inside inputs and the command menu itself.
      if (mod && !e.shiftKey && !e.altKey && key === 'k') {
        e.preventDefault();
        s.setCommandMenuOpen(!s.commandMenuOpen);
        return;
      }

      if (isTyping(e.target) || isOverlayOpen()) return;

      if (s.presentation.active) {
        if (e.key === 'Escape') {
          e.preventDefault();
          s.stopPresentation();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (s.pendingEdge) {
          s.setPendingEdge(null);
        } else if (s.selectedEdgeId) {
          s.setSelectedEdgeId(null);
        } else if (s.selectedNodeId) {
          s.setSelectedNodeId(null);
        } else if (s.nodes.some((n) => n.selected) || s.edges.some((ed) => ed.selected)) {
          s.setNodes(s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)));
          s.setEdges(s.edges.map((ed) => (ed.selected ? { ...ed, selected: false } : ed)));
        }
        return;
      }

      if (mod && !e.altKey) {
        switch (key) {
          case 'a':
            e.preventDefault();
            s.selectAll();
            return;
          case 'c':
            if (window.getSelection()?.toString()) return;
            e.preventDefault();
            s.copySelection();
            return;
          case 'v':
            e.preventDefault();
            s.pasteSelection();
            return;
          case 'd': {
            e.preventDefault();
            const selected = s.nodes.filter((n) => n.selected).map((n) => n.id);
            if (selected.length > 0) s.duplicateNodes(selected);
            else if (s.selectedNodeId) s.duplicateNodes([s.selectedNodeId]);
            return;
          }
          case 'z':
            e.preventDefault();
            if (e.shiftKey) s.redo();
            else s.undo();
            return;
          case 'y':
            e.preventDefault();
            s.redo();
            return;
        }
        return;
      }

      if (e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        s.setShortcutsOpen(true);
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        s.toggleLibrary();
        return;
      }
      if (e.shiftKey && key === 'r') {
        if (s.selectedEdgeId) {
          e.preventDefault();
          s.reverseEdge(s.selectedEdgeId);
        }
        return;
      }
      if (e.shiftKey) return;
      if (key === 'f') {
        e.preventDefault();
        fitView(getFitViewOptions(200));
        return;
      }
      if (key === 'p') {
        if (s.nodes.some((n) => n.type === 'system')) {
          e.preventDefault();
          s.startPresentation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView]);
}
