'use client';

import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { NODE_REGISTRY } from './node-registry';
import type { SystemNodeData, NodeStatus, NodeEnvironment } from '@/types';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { ExternalLink } from 'lucide-react';

const STATUS_CONFIG: Record<NodeStatus, { color: string; label: string }> = {
  operational: { color: 'bg-green-500', label: 'Operational' },
  degraded: { color: 'bg-amber-500', label: 'Degraded' },
  down: { color: 'bg-red-500', label: 'Down' },
  maintenance: { color: 'bg-blue-500', label: 'Maintenance' },
};

const ENV_CONFIG: Record<NodeEnvironment, { className: string; label: string }> = {
  production: { className: 'bg-red-500/10 text-red-600 dark:text-red-400', label: 'prod' },
  staging: { className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'stg' },
  development: { className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', label: 'dev' },
};

type BaseSystemNodeProps = NodeProps & { data: SystemNodeData };

function BaseSystemNodeComponent({ id, data, selected }: BaseSystemNodeProps) {
  const config = NODE_REGISTRY[data.nodeType];
  const Icon = config.icon;
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  return (
    <div
      className={cn(
        'min-w-[160px] min-h-[80px] rounded-lg border-2 px-4 py-3 shadow-sm transition-shadow',
        config.bgColor,
        config.borderColor,
        config.darkBgColor,
        config.darkBorderColor,
        selected && 'shadow-md ring-2 ring-ring'
      )}
      onDoubleClick={() => setSelectedNodeId(id)}
    >
      <NodeResizer
        isVisible={!!selected}
        minWidth={160}
        minHeight={80}
        lineClassName="!border-primary"
        handleClassName="!w-2 !h-2 !bg-primary !border-primary"
      />
      <Handle type="target" id="top-target" position={Position.Top} className="!bg-muted-foreground !w-3 !h-3" />
      <Handle type="source" id="top-source" position={Position.Top} className="!bg-muted-foreground !w-3 !h-3 !opacity-0" />
      <Handle type="target" id="left-target" position={Position.Left} className="!bg-muted-foreground !w-3 !h-3" />
      <Handle type="source" id="left-source" position={Position.Left} className="!bg-muted-foreground !w-3 !h-3 !opacity-0" />

      <div className="flex items-center gap-2">
        <div className="relative">
          <Icon className={cn('h-5 w-5', config.color)} />
          {data.status && (
            <span
              className={cn('absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-1 ring-background', STATUS_CONFIG[data.status].color)}
              title={STATUS_CONFIG[data.status].label}
            />
          )}
        </div>
        <span className="font-medium text-sm text-foreground">{data.label}</span>
        {data.environment && (
          <span className={cn('rounded px-1 py-0 text-[9px] font-semibold uppercase', ENV_CONFIG[data.environment].className)}>
            {ENV_CONFIG[data.environment].label}
          </span>
        )}
      </div>

      {data.techStack.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {data.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded bg-background/60 dark:bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground dark:text-foreground/70"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {data.description && (
        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{data.description}</p>
      )}

      {(data.owner || (data.links && data.links.length > 0)) && (
        <div className="mt-1 flex items-center gap-2">
          {data.owner && (
            <span className="text-[10px] text-muted-foreground/70">{data.owner}</span>
          )}
          {data.links && data.links.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-primary/70">
              <ExternalLink className="h-2.5 w-2.5" />
              {data.links.length}
            </span>
          )}
        </div>
      )}

      <Handle type="source" id="bottom-source" position={Position.Bottom} className="!bg-muted-foreground !w-3 !h-3" />
      <Handle type="target" id="bottom-target" position={Position.Bottom} className="!bg-muted-foreground !w-3 !h-3 !opacity-0" />
      <Handle type="source" id="right-source" position={Position.Right} className="!bg-muted-foreground !w-3 !h-3" />
      <Handle type="target" id="right-target" position={Position.Right} className="!bg-muted-foreground !w-3 !h-3 !opacity-0" />
    </div>
  );
}

export const BaseSystemNode = memo(BaseSystemNodeComponent);
