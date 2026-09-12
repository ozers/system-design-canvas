'use client';

import { useStore } from '@xyflow/react';
import { AlignHorizontalJustifyCenter, Copy, SquareDashed, Trash2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { getNodeRect } from '@/lib/minimap';
import { getShortcutKeys } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';

const PILL_CLEARANCE = 52;

/** Floating action pill above a multi-node selection. */
export function SelectionActions() {
  const nodes = useCanvasStore((s) => s.nodes);
  const [tx, ty, zoom] = useStore((s) => s.transform);
  const marqueeActive = useStore((s) => s.userSelectionActive);

  const selected = nodes.filter((n) => n.selected);
  if (selected.length < 2 || marqueeActive || selected.some((n) => n.dragging)) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of selected) {
    const r = getNodeRect(node);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  const left = ((minX + maxX) / 2) * zoom + tx;
  const top = minY * zoom + ty - 10;
  // Not enough room above the selection → hang the pill below it.
  const below = top < PILL_CLEARANCE;

  const store = () => useCanvasStore.getState();
  const iconBtn = 'size-7 [&_svg:not([class*=size-])]:size-3.5';

  return (
    <div
      role="toolbar"
      aria-label="Selection actions"
      className={cn(
        'animate-fade-in absolute z-[11] flex items-center gap-0.5 rounded-full border border-line bg-paper py-1 pr-1 pl-3 text-[12.5px] whitespace-nowrap shadow-[var(--shadow-lg)]',
        below ? '-translate-x-1/2' : '-translate-x-1/2 -translate-y-full'
      )}
      style={{ left, top: below ? maxY * zoom + ty + 10 : top }}
    >
      <span className="mr-1.5 font-medium">{selected.length} selected</span>
      <SimpleTooltip label="Group">
        <Button variant="icon" size="icon-sm" className={iconBtn} aria-label="Group" onClick={() => store().groupSelection()}>
          <SquareDashed />
        </Button>
      </SimpleTooltip>
      <SimpleTooltip label="Align">
        <Button variant="icon" size="icon-sm" className={iconBtn} aria-label="Align" onClick={() => store().alignSelection()}>
          <AlignHorizontalJustifyCenter />
        </Button>
      </SimpleTooltip>
      <SimpleTooltip label="Duplicate" keys={getShortcutKeys('duplicate')}>
        <Button variant="icon" size="icon-sm" className={iconBtn} aria-label="Duplicate" onClick={() => store().duplicateNodes()}>
          <Copy />
        </Button>
      </SimpleTooltip>
      <SimpleTooltip label="Delete" keys={getShortcutKeys('delete')}>
        <Button
          variant="danger"
          size="icon-sm"
          className={cn(iconBtn, 'rounded-full')}
          aria-label="Delete"
          onClick={() => store().deleteSelection()}
        >
          <Trash2 />
        </Button>
      </SimpleTooltip>
    </div>
  );
}
