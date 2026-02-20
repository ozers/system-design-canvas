'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { EDGE_REGISTRY } from './edge-registry';
import { SYSTEM_EDGE_TYPES, type SystemEdgeType } from '@/types';

export function ConnectionTypePicker() {
  const pendingEdge = useCanvasStore((s) => s.pendingEdge);
  const setPendingEdge = useCanvasStore((s) => s.setPendingEdge);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendingEdge) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPendingEdge(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingEdge(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [pendingEdge, setPendingEdge]);

  if (!pendingEdge) return null;

  const handleSelect = (edgeType: SystemEdgeType) => {
    updateEdgeData(pendingEdge.edgeId, { edgeType });
    setPendingEdge(null);
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-lg border border-border bg-card p-1.5 shadow-lg"
      style={{
        left: pendingEdge.position.x,
        top: pendingEdge.position.y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      <p className="px-1.5 pb-1 text-[10px] font-medium text-muted-foreground">
        Connection type
      </p>
      <div className="grid grid-cols-2 gap-0.5">
        {SYSTEM_EDGE_TYPES.map((type) => {
          const config = EDGE_REGISTRY[type];
          return (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors hover:bg-accent"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
