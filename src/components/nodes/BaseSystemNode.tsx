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
        config.darkBgColor,
        config.darkBorderColor,
        selected && 'shadow-md ring-2 ring-ring'
      )}
      onDoubleClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-muted-foreground !w-3 !h-3" />

      <div className="flex items-center gap-2">
        <Icon className={cn('h-5 w-5', config.color)} />
        <span className="font-medium text-sm text-foreground">{data.label}</span>
      </div>

      {data.techStack.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {data.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {data.description && (
        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{data.description}</p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-muted-foreground !w-3 !h-3" />
    </div>
  );
}

export const BaseSystemNode = memo(BaseSystemNodeComponent);
