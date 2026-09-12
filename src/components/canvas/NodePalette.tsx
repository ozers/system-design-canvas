'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ChevronDown, PanelLeft } from 'lucide-react';
import {
  CATEGORY_ICONS,
  getNodesByCategory,
  type NodeCategory,
  type NodeTypeConfig,
} from '@/components/nodes/node-registry';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useIsNarrow } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { IconChip, Panel } from '@/components/ui/panel';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { getShortcutKeys } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';
import type { SystemNodeType } from '@/types';
import { useAddNodeAtCenter } from './canvas-helpers';

type CategoryGroup = ReturnType<typeof getNodesByCategory>[number];

const ALL_CATEGORIES = getNodesByCategory();

function matches(config: NodeTypeConfig, q: string) {
  return (
    config.label.toLowerCase().includes(q) ||
    config.defaultTechStack.some((t) => t.toLowerCase().includes(q)) ||
    config.suggestedTech.some((t) => t.toLowerCase().includes(q))
  );
}

function filterCategories(query: string): CategoryGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_CATEGORIES;
  return ALL_CATEGORIES.map(({ category, types }) => ({
    category,
    types: types.filter(({ config }) => matches(config, q)),
  })).filter((g) => g.types.length > 0);
}

function onDragStart(event: DragEvent, nodeType: SystemNodeType) {
  event.dataTransfer.setData('application/reactflow-nodetype', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

function EmptySearch({ query }: { query: string }) {
  return <p className="px-2 py-6 text-center text-[12.5px] text-ink-3">No components for “{query.trim()}”</p>;
}

interface ScrollTarget {
  category: NodeCategory;
  nonce: number;
}

function LibraryPanel({
  query,
  onQueryChange,
  closed,
  onToggleCategory,
  scrollTarget,
  onAdd,
  onCollapse,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  closed: ReadonlySet<NodeCategory>;
  onToggleCategory: (c: NodeCategory) => void;
  scrollTarget: ScrollTarget | null;
  onAdd: (type: SystemNodeType) => void;
  onCollapse: () => void;
}) {
  const sections = useRef(new Map<NodeCategory, HTMLElement>());
  const filtered = useMemo(() => filterCategories(query), [query]);
  const searching = query.trim().length > 0;

  useEffect(() => {
    if (!scrollTarget) return;
    sections.current.get(scrollTarget.category)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [scrollTarget]);

  return (
    <Panel className="animate-panel-in absolute top-4 bottom-4 left-4 z-10 flex w-[260px] flex-col overflow-hidden">
      <div className="flex items-center justify-between pt-2.5 pr-2 pb-2 pl-3.5">
        <h2 className="text-[13.5px] font-semibold">Library</h2>
        <SimpleTooltip label="Collapse" keys={getShortcutKeys('toggle-library')} side="right">
          <Button variant="icon" size="icon-sm" aria-label="Collapse library" onClick={onCollapse}>
            <PanelLeft className="size-[15px]" />
          </Button>
        </SimpleTooltip>
      </div>
      <div className="px-2.5 pb-2">
        <SearchInput
          variant="inset"
          placeholder="Search components"
          aria-label="Search components"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 && <EmptySearch query={query} />}
        {filtered.map(({ category, types }) => {
          const open = searching || !closed.has(category);
          return (
            <section
              key={category}
              ref={(el) => {
                if (el) sections.current.set(category, el);
                else sections.current.delete(category);
              }}
              className="scroll-mt-1 pb-1"
            >
              <button
                type="button"
                onClick={() => onToggleCategory(category)}
                aria-expanded={open}
                className="focus-ring flex h-7 w-full items-center gap-1 rounded-[7px] px-2 text-left text-[11.5px] font-medium text-ink-3 transition-colors duration-[120ms] hover:text-ink-2"
              >
                {category}
                <ChevronDown
                  className={cn('ml-auto size-3.5 transition-transform duration-[120ms]', !open && '-rotate-90')}
                />
              </button>
              {open && (
                <div className="grid gap-px">
                  {types.map(({ type, config }) => {
                    const Icon = config.icon;
                    return (
                      <div
                        key={type}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => onDragStart(e, type)}
                        onClick={() => onAdd(type)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onAdd(type);
                          }
                        }}
                        aria-label={`Add ${config.label}`}
                        className="focus-ring flex h-9 cursor-grab items-center gap-2.5 rounded-[9px] px-2 text-[13px] text-ink transition-colors duration-[120ms] select-none hover:bg-line-2 active:cursor-grabbing"
                      >
                        <IconChip color={config.color} size={22}>
                          <Icon className="size-[13px]" />
                        </IconChip>
                        <span className="truncate">{config.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Panel>
  );
}

function LibraryRail({ onExpand, onOpenCategory }: { onExpand: () => void; onOpenCategory: (c: NodeCategory) => void }) {
  return (
    <Panel className="animate-panel-in absolute top-4 left-4 z-10 flex flex-col gap-0.5 p-[5px]">
      <SimpleTooltip label="Library" keys={getShortcutKeys('toggle-library')} side="right">
        <Button
          variant="icon"
          size="icon-toolbar"
          aria-label="Open library"
          onClick={onExpand}
          className="bg-line-2 text-ink"
        >
          <PanelLeft />
        </Button>
      </SimpleTooltip>
      <div aria-hidden className="mx-1.5 my-[3px] h-px bg-line" />
      {ALL_CATEGORIES.map(({ category }) => {
        const Icon = CATEGORY_ICONS[category];
        return (
          <SimpleTooltip key={category} label={category} side="right">
            <Button variant="icon" size="icon-toolbar" aria-label={category} onClick={() => onOpenCategory(category)}>
              <Icon />
            </Button>
          </SimpleTooltip>
        );
      })}
    </Panel>
  );
}

function LibrarySheet({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (q: string) => void;
  onAdd: (type: SystemNodeType) => void;
}) {
  const [active, setActive] = useState<NodeCategory>(ALL_CATEGORIES[0].category);
  const searching = query.trim().length > 0;
  const items = useMemo(() => {
    if (searching) return filterCategories(query).flatMap((g) => g.types);
    return ALL_CATEGORIES.find((g) => g.category === active)?.types ?? [];
  }, [searching, query, active]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-center gap-2 px-3.5 pt-1 pb-2">
          <SheetTitle>Library</SheetTitle>
          <SearchInput
            variant="inset"
            placeholder="Search components"
            aria-label="Search components"
            containerClassName="ml-auto w-[min(220px,60%)]"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        {!searching && (
          <div className="flex shrink-0 gap-1.5 overflow-x-auto px-3.5 pb-2.5">
            {ALL_CATEGORIES.map(({ category }) => (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                aria-pressed={active === category}
                className={cn(
                  'focus-ring inline-flex h-[26px] shrink-0 items-center rounded-full border px-2.5 text-[12px] whitespace-nowrap transition-colors duration-[120ms]',
                  active === category ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink-2 hover:text-ink'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3.5">
          {items.length === 0 ? (
            <EmptySearch query={query} />
          ) : (
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {items.map(({ type, config }) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(type)}
                    className="focus-ring flex h-11 items-center gap-2 rounded-[10px] border border-line bg-paper px-2.5 text-left text-[12.5px] text-ink transition-colors duration-[120ms] hover:bg-line-2"
                  >
                    <IconChip color={config.color} size={24}>
                      <Icon className="size-[14px]" />
                    </IconChip>
                    <span className="truncate">{config.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function NodePalette() {
  const narrow = useIsNarrow();
  const collapsed = useCanvasStore((s) => s.libraryCollapsed);
  const setCollapsed = useCanvasStore((s) => s.setLibraryCollapsed);
  const addAtCenter = useAddNodeAtCenter();
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<ReadonlySet<NodeCategory>>(new Set());
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget | null>(null);

  if (narrow) {
    return (
      <LibrarySheet
        open={!collapsed}
        onOpenChange={(open) => setCollapsed(!open)}
        query={query}
        onQueryChange={setQuery}
        onAdd={(type) => {
          addAtCenter(type);
          setCollapsed(true);
        }}
      />
    );
  }

  if (collapsed) {
    return (
      <LibraryRail
        onExpand={() => setCollapsed(false)}
        onOpenCategory={(category) => {
          setQuery('');
          setClosed((prev) => {
            const next = new Set(prev);
            next.delete(category);
            return next;
          });
          setScrollTarget((prev) => ({ category, nonce: (prev?.nonce ?? 0) + 1 }));
          setCollapsed(false);
        }}
      />
    );
  }

  return (
    <LibraryPanel
      query={query}
      onQueryChange={setQuery}
      closed={closed}
      onToggleCategory={(category) =>
        setClosed((prev) => {
          const next = new Set(prev);
          if (next.has(category)) next.delete(category);
          else next.add(category);
          return next;
        })
      }
      scrollTarget={scrollTarget}
      onAdd={addAtCenter}
      onCollapse={() => setCollapsed(true)}
    />
  );
}
