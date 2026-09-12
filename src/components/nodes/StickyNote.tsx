'use client';

import { memo } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { cn } from '@/lib/utils';
import type { SystemNode } from '@/types';

function StickyNoteComponent({ id, data, selected }: NodeProps<SystemNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const presenting = useCanvasStore((s) => s.presentation.active);

  return (
    <div
      className={cn(
        'flex size-full min-h-[80px] min-w-[180px] flex-col border border-note-line bg-note px-3 py-2.5 text-ink transition-shadow duration-[120ms] ease-out',
        selected ? 'shadow-[0_0_0_3px_var(--accent-soft),var(--shadow)]' : 'shadow-[var(--shadow)]'
      )}
      style={{ borderRadius: '10px 10px 10px 2px' }}
    >
      <NodeResizer isVisible={!!selected && !presenting} minWidth={180} minHeight={80} />
      <textarea
        aria-label="Note"
        rows={3}
        readOnly={presenting}
        className="w-full flex-1 resize-none bg-transparent text-[12.5px] leading-[1.45] text-ink outline-none placeholder:text-ink-3"
        value={data.label ?? ''}
        placeholder="Type a note…"
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
        onKeyDown={(e) => {
          // Let Esc through to the canvas; keep ⌫ etc. from deleting the note.
          if (e.key !== 'Escape') e.stopPropagation();
        }}
      />
    </div>
  );
}

export const StickyNote = memo(StickyNoteComponent);
