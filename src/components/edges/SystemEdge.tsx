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
import { Clock, FileJson, Activity } from 'lucide-react';
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
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);
  const hasMeta = data?.latency || data?.dataFormat || data?.throughput;

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
          className="flex flex-col items-center gap-0.5"
        >
          <div
            className="flex items-center gap-1 rounded bg-popover text-popover-foreground px-2 py-0.5 text-[11px] font-medium shadow-sm border border-border cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEdgeId(id);
            }}
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
          {hasMeta && (
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {data?.latency && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0 text-[9px] font-medium">
                  <Clock className="h-2.5 w-2.5" />
                  {data.latency}
                </span>
              )}
              {data?.dataFormat && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0 text-[9px] font-medium">
                  <FileJson className="h-2.5 w-2.5" />
                  {data.dataFormat}
                </span>
              )}
              {data?.throughput && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0 text-[9px] font-medium">
                  <Activity className="h-2.5 w-2.5" />
                  {data.throughput}
                </span>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const SystemEdge = memo(SystemEdgeComponent);
