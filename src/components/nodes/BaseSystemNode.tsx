'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_REGISTRY } from './node-registry';
import type { SystemNodeData } from '@/types';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/useCanvasStore';

type BaseSystemNodeProps = NodeProps & { data: SystemNodeData };

function BaseSystemNodeComponent({ id, data, selected }: BaseSystemNodeProps) {
  const config = NODE_REGISTRY[data.nodeType];
  const Icon = config.icon;
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  return (
    <div
      className={cn(
        'min-w-[160px] rounded-lg border-2 px-4 py-3 shadow-sm transition-shadow',
        config.bgColor,
        config.borderColor,
        'dark:bg-opacity-20 dark:border-opacity-50',
        selected && 'shadow-md ring-2 ring-blue-400'
      )}
      onDoubleClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3" />

      <div className="flex items-center gap-2">
        <Icon className={cn('h-5 w-5', config.color)} />
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{data.label}</span>
      </div>

      {data.techStack.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {data.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded bg-white/60 dark:bg-black/30 px-1.5 py-0.5 text-[10px] text-gray-600 dark:text-gray-300"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {data.description && (
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{data.description}</p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3" />
    </div>
  );
}

export const BaseSystemNode = memo(BaseSystemNodeComponent);
