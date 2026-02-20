'use client';

import { memo, useCallback } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { X } from 'lucide-react';

interface StickyNoteData {
  label: string;
  nodeType: 'note';
  description?: string;
  techStack: string[];
}

type StickyNoteProps = NodeProps & { data: StickyNoteData };

function StickyNoteComponent({ id, data, selected }: StickyNoteProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { label: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <div
      className={`min-w-[180px] min-h-[80px] rounded-md p-3 shadow-md transition-shadow bg-amber-100 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 ${
        selected ? 'ring-2 ring-ring shadow-lg' : ''
      }`}
    >
      <NodeResizer
        isVisible={!!selected}
        minWidth={180}
        minHeight={80}
        lineClassName="!border-amber-500"
        handleClassName="!w-2 !h-2 !bg-amber-500 !border-amber-500"
      />
      {selected && (
        <button
          className="absolute -right-2 -top-2 rounded-full bg-card shadow p-0.5 hover:bg-destructive/10"
          onClick={() => deleteNode(id)}
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
      <textarea
        className="w-full resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
        rows={3}
        value={data.label}
        onChange={handleChange}
        placeholder="Type a note..."
      />
    </div>
  );
}

export const StickyNote = memo(StickyNoteComponent);
