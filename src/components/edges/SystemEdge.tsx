'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { EDGE_REGISTRY } from './edge-registry';
import { EdgeTypeSelector } from './EdgeTypeSelector';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { SystemEdgeData } from '@/types';

type SystemEdgeProps = EdgeProps & { data?: SystemEdgeData };

function SystemEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: SystemEdgeProps) {
  const edgeType = data?.edgeType ?? 'rest';
  const config = EDGE_REGISTRY[edgeType];
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const label = data?.label || config.label;

  const startEditing = useCallback(() => {
    setEditValue(data?.label ?? '');
    setEditing(true);
  }, [data?.label]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    updateEdgeData(id, { label: editValue });
  }, [id, editValue, updateEdgeData]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: config.color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: config.strokeDasharray,
        }}
        className={config.animated ? (['websocket', 'pub-sub', 'mqtt'].includes(edgeType) ? 'edge-animated-fast' : 'edge-animated-slow') : ''}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center gap-1 rounded bg-popover text-popover-foreground px-2 py-0.5 text-[11px] font-medium shadow-sm border border-border"
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-20 bg-transparent outline-none text-[11px]"
            />
          ) : (
            label
          )}
          {selected && !editing && (
            <EdgeTypeSelector
              edgeId={id}
              currentType={edgeType}
              currentLabel={data?.label}
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const SystemEdge = memo(SystemEdgeComponent);
