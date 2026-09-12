'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MinimapThumb } from '@/components/shared/MinimapThumb';
import { TEMPLATES } from '@/lib/templates';
import { cn, plural } from '@/lib/utils';
import { countComponents } from './project-io';

const MIN_CARD_WIDTH = 180;
const GAP = 12;

interface TemplateStripProps {
  onSelect: (templateId: string) => void;
  /** Start expanded (e.g. when there are no projects yet). The user's toggle wins afterwards. */
  defaultExpanded?: boolean;
}

/** Dashboard template grid: one row when collapsed, "Show all" reveals the rest. */
export function TemplateStrip({ onSelect, defaultExpanded = false }: TemplateStripProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(5);
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
  const expanded = userExpanded ?? defaultExpanded;

  // Same math as `repeat(auto-fill, minmax(180px, 1fr))`, so the first row is exactly `columns` cards.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumns(Math.max(1, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasMore = TEMPLATES.length > columns;
  const visible = expanded ? TEMPLATES : TEMPLATES.slice(0, columns);

  return (
    <section aria-labelledby="templates-heading">
      <div className="mb-3 flex h-7 items-center justify-between gap-3">
        <h2 id="templates-heading" className="text-[13px] font-medium text-ink-2">
          Start from a template
        </h2>
        {hasMore && (
          <Button
            variant="ghost"
            onClick={() => setUserExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="template-grid"
            className="-mr-2 h-7 gap-1 px-2.5 text-[12.5px]"
          >
            {expanded ? 'Show less' : (
              <>
                Show all
                <span className="font-mono text-[11px] text-ink-3">{TEMPLATES.length}</span>
              </>
            )}
            <ChevronDown className={cn('size-[13px] text-ink-3 transition-transform duration-150', expanded && 'rotate-180')} />
          </Button>
        )}
      </div>

      <div
        id="template-grid"
        ref={gridRef}
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${MIN_CARD_WIDTH}px, 1fr))` }}
      >
        {visible.map((template, i) => (
          <button
            key={template.id}
            type="button"
            title={template.description}
            aria-label={template.name}
            onClick={() => onSelect(template.id)}
            className={cn(
              'focus-ring group flex min-w-0 flex-col gap-2.5 rounded-[12px] border border-line bg-paper p-2 text-left transition-[border-color,box-shadow] duration-[120ms] hover:border-ink-3 hover:shadow-[var(--shadow)]',
              i >= columns && 'animate-panel-in'
            )}
          >
            <div className="dot-grid flex h-[92px] w-full items-center justify-center overflow-hidden rounded-[8px] border border-line-2 [background-size:12px_12px]">
              <div className="h-[80%] w-[80%] transition-transform duration-200 group-hover:scale-[1.04]">
                <MinimapThumb nodes={template.nodes} edges={template.edges} opacity={0.8} />
              </div>
            </div>
            <div className="min-w-0 px-1 pb-0.5">
              <div className="truncate text-[13px] leading-[18px] font-semibold text-ink">{template.name}</div>
              <div className="truncate font-mono text-[11px] leading-4 text-ink-3">
                {plural(countComponents(template.nodes), 'component')}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
