import type { SystemNode, SystemEdge, SystemNodeData } from '@/types';

/** Soft fills for minimap and thumbnail rects, per node type. */
export const MINIMAP_COLORS: Record<string, string> = {
  service: '#93bbfd',
  database: '#86e0a5',
  cache: '#fcd68d',
  queue: '#f9a8d4',
  'load-balancer': '#a5b4fc',
  client: '#c4b5fd',
  cdn: '#7dd3c4',
  'api-gateway': '#fca5a5',
  group: '#94a3b8',
  note: '#fcd68d',
  dns: '#7dd3fc',
  waf: '#fdba74',
  worker: '#94a3b8',
  serverless: '#c4b5fd',
  'container-cluster': '#67e8f9',
  'object-storage': '#6ee7b7',
  'search-index': '#fde047',
  stream: '#fda4af',
  scheduler: '#a8a29e',
  logging: '#bef264',
  monitoring: '#f0abfc',
};

export function getMinimapColor(node: SystemNode): string {
  if (node.type === 'note') return MINIMAP_COLORS.note;
  if (node.type === 'group') return MINIMAP_COLORS.group;
  const nodeType = (node.data as SystemNodeData | undefined)?.nodeType;
  return (nodeType && MINIMAP_COLORS[nodeType]) || '#94a3b8';
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Best-known size of a stored node (measured → explicit → style → default). */
export function getNodeRect(node: SystemNode): Rect {
  const styleW = typeof node.style?.width === 'number' ? node.style.width : undefined;
  const styleH = typeof node.style?.height === 'number' ? node.style.height : undefined;
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.measured?.width ?? node.width ?? styleW ?? 200,
    height: node.measured?.height ?? node.height ?? styleH ?? 72,
  };
}

/** Bounding box of all nodes, padded. Null when there are no nodes. */
export function getBounds(nodes: SystemNode[], pad = 40): Rect | null {
  if (nodes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const r = getNodeRect(node);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}

/** Anchor point of an edge end, from the handle id's side ("bottom-source" → bottom center). */
export function getHandlePoint(rect: Rect, handle: string | null | undefined): { x: number; y: number } {
  const side = handle?.split('-')[0];
  switch (side) {
    case 'top':
      return { x: rect.x + rect.width / 2, y: rect.y };
    case 'bottom':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
    case 'left':
      return { x: rect.x, y: rect.y + rect.height / 2 };
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
    default:
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }
}

export type { SystemEdge };
