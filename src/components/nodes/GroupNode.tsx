'use client';

import { memo, useCallback } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { BoxSelect } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';

interface GroupNodeData {
  label: string;
  nodeType: 'group';
  description?: string;
  techStack: string[];
}

type GroupNodeProps = NodeProps & { data: GroupNodeData };

function GroupNodeComponent({ id, data, selected }: GroupNodeProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { label: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      className={`relative rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/30 dark:bg-slate-900/20 transition-shadow ${
        selected ? 'shadow-md ring-2 ring-ring' : ''
      }`}
    >
      <NodeResizer
        isVisible={!!selected}
        minWidth={200}
        minHeight={120}
        lineClassName="!border-slate-400 dark:!border-slate-500"
        handleClassName="!w-2 !h-2 !bg-slate-400 !border-slate-400 dark:!bg-slate-500 dark:!border-slate-500"
      />
      <div className="flex items-center gap-1.5 px-3 py-2">
        <BoxSelect className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
        <input
          className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider outline-none placeholder-slate-400 dark:placeholder-slate-500"
          value={data.label}
          onChange={handleLabelChange}
          placeholder="Group name..."
        />
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
