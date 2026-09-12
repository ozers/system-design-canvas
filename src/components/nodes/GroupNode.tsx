'use client';

import { memo } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { cn } from '@/lib/utils';
import type { SystemNode } from '@/types';

function GroupNodeComponent({ id, data, selected }: NodeProps<SystemNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const presenting = useCanvasStore((s) => s.presentation.active);
  const label = data.label ?? '';

  return (
    <div
      className={cn(
        'relative size-full rounded-[16px] border border-dashed transition-[border-color,box-shadow] duration-[120ms] ease-out',
        selected ? 'border-accent shadow-[0_0_0_3px_var(--accent-soft)]' : 'border-ink-3'
      )}
      style={{ background: 'color-mix(in oklch, var(--paper) 35%, transparent)' }}
    >
      <NodeResizer isVisible={!!selected && !presenting} minWidth={200} minHeight={120} />

      {/* Auto-width label pill: an invisible copy of the text sizes the grid cell. */}
      <span className="absolute -top-[11px] left-3 inline-grid max-w-[calc(100%-24px)] rounded-full border border-line bg-paper px-[9px] py-0.5 text-[11.5px] leading-4 font-medium text-ink-2 transition-[border-color,box-shadow] duration-[120ms] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
        <span aria-hidden className="invisible col-start-1 row-start-1 overflow-hidden whitespace-pre">
          {label || 'Group name'}
        </span>
        <input
          aria-label="Group name"
          size={1}
          readOnly={presenting}
          className="col-start-1 row-start-1 w-full min-w-0 bg-transparent outline-none placeholder:text-ink-3"
          value={label}
          placeholder="Group name"
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            // Let Esc through to the canvas; keep ⌫ etc. from deleting the group.
            if (e.key !== 'Escape') e.stopPropagation();
          }}
        />
      </span>
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
