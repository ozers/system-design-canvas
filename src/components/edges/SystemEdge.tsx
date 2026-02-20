'use client';

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { EDGE_REGISTRY } from './edge-registry';
import { EdgeTypeSelector } from './EdgeTypeSelector';
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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const label = data?.label || config.label;

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
        className={config.animated ? 'react-flow__edge-animated' : ''}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center gap-1 rounded bg-white dark:bg-gray-800 dark:text-gray-200 px-2 py-0.5 text-[11px] font-medium shadow-sm border border-gray-200 dark:border-gray-600"
        >
          {label}
          {selected && (
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
