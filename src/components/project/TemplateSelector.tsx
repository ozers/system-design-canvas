'use client';

import { TEMPLATES } from '@/lib/templates';
import { cn, plural } from '@/lib/utils';
import { MinimapThumb } from '@/components/shared/MinimapThumb';

interface TemplateGridProps {
  selectedId: string;
  onSelect: (templateId: string) => void;
  /** Double-click or Enter on a card. */
  onActivate?: (templateId: string) => void;
}

/** Selectable template cards for the New project dialog. */
export function TemplateGrid({ selectedId, onSelect, onActivate }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
      {TEMPLATES.map((template) => {
        const selected = template.id === selectedId;
        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={selected}
            title={template.description}
            onClick={() => onSelect(template.id)}
            onDoubleClick={() => onActivate?.(template.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onActivate) {
                e.preventDefault();
                onActivate(template.id);
              }
            }}
            className={cn(
              'grid min-w-0 gap-2 rounded-[12px] border bg-paper p-2.5 text-left text-ink outline-none transition-[border-color,box-shadow] duration-[120ms]',
              selected
                ? 'border-accent shadow-[0_0_0_3px_var(--accent-soft)]'
                : 'border-line hover:border-ink-3 focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]'
            )}
          >
            <div className="h-14 overflow-hidden rounded-[8px] bg-line-2 p-1.5">
              <MinimapThumb nodes={template.nodes} edges={template.edges} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] leading-4 font-semibold">{template.name}</div>
              <div className="truncate font-mono text-[11px] leading-[14px] text-ink-3">
                {plural(template.nodes.length, 'node')}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
