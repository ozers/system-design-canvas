'use client';

import { memo, useMemo } from 'react';
import type { SystemNode, SystemEdge } from '@/types';
import { getBounds, getHandlePoint, getMinimapColor, getNodeRect } from '@/lib/minimap';
import { cn } from '@/lib/utils';

interface MinimapThumbProps {
  nodes: SystemNode[];
  edges: SystemEdge[];
  className?: string;
  /** Fill opacity of node rects. */
  opacity?: number;
  /** Rendered when there are no nodes. */
  empty?: React.ReactNode;
}

/** Static SVG minimap of a design: colored rects + ink-3 connector lines. */
function MinimapThumbComponent({ nodes, edges, className, opacity = 0.85, empty = null }: MinimapThumbProps) {
  const content = useMemo(() => {
    const bounds = getBounds(nodes);
    if (!bounds) return null;
    const rects = new Map(nodes.map((n) => [n.id, getNodeRect(n)]));
    // Groups first so members draw on top.
    const ordered = [...nodes].sort((a, b) => Number(b.type === 'group') - Number(a.type === 'group'));
    return { bounds, rects, ordered };
  }, [nodes]);

  if (!content) return <>{empty}</>;
  const { bounds, rects, ordered } = content;

  return (
    <svg
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn('block h-full w-full', className)}
      aria-hidden
    >
      {edges.map((edge) => {
        const s = rects.get(edge.source);
        const t = rects.get(edge.target);
        if (!s || !t) return null;
        const a = getHandlePoint(s, edge.sourceHandle);
        const b = getHandlePoint(t, edge.targetHandle);
        return (
          <line
            key={edge.id}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--ink-3)"
            strokeWidth={3}
            opacity={0.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {ordered.map((node) => {
        const r = rects.get(node.id)!;
        const isGroup = node.type === 'group';
        return (
          <rect
            key={node.id}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            rx={14}
            fill={isGroup ? 'none' : getMinimapColor(node)}
            stroke={isGroup ? 'var(--ink-3)' : undefined}
            strokeDasharray={isGroup ? '6 6' : undefined}
            opacity={isGroup ? 0.6 : opacity}
          />
        );
      })}
    </svg>
  );
}

export const MinimapThumb = memo(MinimapThumbComponent);
