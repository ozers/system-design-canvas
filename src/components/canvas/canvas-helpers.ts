'use client';

import { useCallback, useRef } from 'react';
import { useReactFlow, useStoreApi, type FitViewOptions } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { createNoteNode, createSystemNode } from '@/lib/node-factory';
import { formatKey } from '@/components/ui/kbd';
import { getShortcutKeys, type ShortcutId } from '@/lib/shortcuts';
import type { SystemEdge, SystemNode, SystemNodeType } from '@/types';

/**
 * fitView options that keep the diagram clear of the floating chrome:
 * library (left), validation panel (top), toolbar (bottom), open editor (right).
 */
export function getFitViewOptions(duration?: number): FitViewOptions {
  if (typeof window === 'undefined') return { padding: 0.15, duration };
  if (window.matchMedia('(max-width: 899px)').matches) {
    return { padding: { top: '72px', right: '24px', bottom: '24px', left: '24px' }, duration };
  }
  const { libraryCollapsed, selectedNodeId, selectedEdgeId } = useCanvasStore.getState();
  return {
    padding: {
      top: '76px',
      right: selectedNodeId || selectedEdgeId ? '340px' : '48px',
      bottom: '96px',
      left: libraryCollapsed ? '96px' : '308px',
    },
    duration,
  };
}

/** "⌘D" on Apple, "Ctrl+D" elsewhere — for menu shortcut hints. */
export function formatShortcut(keys: string[]) {
  const mapped = keys.map(formatKey);
  return mapped.join(mapped.some((k) => k.length > 1) ? '+' : '');
}

export function shortcutLabel(id: ShortcutId) {
  return formatShortcut(getShortcutKeys(id));
}

/**
 * Adds a component (or note) at the center of the visible canvas, nudging each
 * successive add so repeated clicks don't stack exactly.
 */
export function useAddNodeAtCenter() {
  const { screenToFlowPosition } = useReactFlow();
  const storeApi = useStoreApi();
  const addNode = useCanvasStore((s) => s.addNode);
  const counter = useRef(0);

  return useCallback(
    (kind: SystemNodeType | 'note') => {
      const { domNode } = storeApi.getState();
      const rect = domNode?.getBoundingClientRect();
      const center = screenToFlowPosition({
        x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      });
      const offset = (counter.current++ % 8) * 24;
      const half = kind === 'group' ? { w: 160, h: 100 } : { w: 100, h: 36 };
      const position = { x: center.x - half.w + offset, y: center.y - half.h + offset };
      const node = kind === 'note' ? createNoteNode(position) : createSystemNode(kind, position);
      addNode(node);
      return node;
    },
    [storeApi, screenToFlowPosition, addNode]
  );
}

/**
 * Presentation order: BFS over edges (undirected) from the start node, else the
 * first component; unreached components follow in array order. Components only.
 */
export function presentationOrder(nodes: SystemNode[], edges: SystemEdge[], startId: string | null | undefined) {
  const system = nodes.filter((n) => n.type === 'system');
  if (system.length === 0) return [];
  const byId = new Map(system.map((n) => [n.id, n]));
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    adjacency.set(e.source, [...(adjacency.get(e.source) ?? []), e.target]);
    adjacency.set(e.target, [...(adjacency.get(e.target) ?? []), e.source]);
  }
  const start = startId && byId.has(startId) ? startId : system[0].id;
  const visited = new Set<string>([start]);
  const queue = [start];
  const order: SystemNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(byId.get(id)!);
    for (const next of adjacency.get(id) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  for (const n of system) {
    if (!visited.has(n.id)) order.push(n);
  }
  return order;
}
