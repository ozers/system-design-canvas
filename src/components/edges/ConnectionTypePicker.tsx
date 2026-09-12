'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { ProtocolMenu } from './ProtocolPicker';

const MENU_WIDTH = 200;
/** Header + 9 items + padding. */
const MENU_HEIGHT = 340;
const GAP = 12;
const MARGIN = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Protocol menu shown right after a new connection is drawn.
 * `pendingEdge.position` is in client coordinates, so the menu is portaled
 * to <body> and positioned `fixed`, clamped to the viewport.
 */
export function ConnectionTypePicker() {
  const pendingEdge = useCanvasStore((s) => s.pendingEdge);
  const presenting = useCanvasStore((s) => s.presentation.active);
  const currentType = useCanvasStore((s) => {
    const pending = s.pendingEdge;
    return pending ? s.edges.find((e) => e.id === pending.edgeId)?.data?.edgeType : undefined;
  });
  const setPendingEdge = useCanvasStore((s) => s.setPendingEdge);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendingEdge) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPendingEdge(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setPendingEdge(null);
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    // Focus the current protocol so arrow keys work right away.
    ref.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [pendingEdge, setPendingEdge]);

  if (!pendingEdge || presenting || !currentType) return null;

  const { x, y } = pendingEdge.position;
  const left = clamp(x - MENU_WIDTH / 2, MARGIN, window.innerWidth - MENU_WIDTH - MARGIN);
  const fitsBelow = y + GAP + MENU_HEIGHT <= window.innerHeight - MARGIN;
  const top = fitsBelow ? y + GAP : Math.max(MARGIN, y - GAP - MENU_HEIGHT);

  return createPortal(
    <ProtocolMenu
      ref={ref}
      title="Connection type"
      value={currentType}
      onSelect={(edgeType) => {
        if (edgeType !== currentType) updateEdgeData(pendingEdge.edgeId, { edgeType });
        setPendingEdge(null);
      }}
      className="animate-fade-in fixed z-50"
      style={{ left, top }}
    />,
    document.body
  );
}
