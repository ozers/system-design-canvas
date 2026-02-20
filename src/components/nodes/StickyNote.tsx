'use client';

import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { X } from 'lucide-react';

interface StickyNoteData {
  label: string;
  nodeType: 'note';
  description?: string;
  techStack: string[];
  color?: string;
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
      className={`min-w-[180px] max-w-[280px] rounded-md p-3 shadow-md transition-shadow ${
        selected ? 'ring-2 ring-blue-400 shadow-lg' : ''
      }`}
      style={{
        backgroundColor: data.color || '#fef3c7',
      }}
    >
      {selected && (
        <button
          className="absolute -right-2 -top-2 rounded-full bg-white dark:bg-gray-800 shadow p-0.5 hover:bg-red-100"
          onClick={() => deleteNode(id)}
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
      )}
      <textarea
        className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        rows={3}
        value={data.label}
        onChange={handleChange}
        placeholder="Type a note..."
      />
    </div>
  );
}

export const StickyNote = memo(StickyNoteComponent);
