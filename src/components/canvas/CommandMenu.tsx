'use client';

import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useReactFlow } from '@xyflow/react';
import {
  CornerDownRight,
  Download,
  FolderOpen,
  Keyboard,
  LayoutDashboard,
  Presentation,
  Redo2,
  Search,
  Settings2,
  Share2,
  SunMoon,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Kbd, KbdCombo } from '@/components/ui/kbd';
import { IconChip } from '@/components/ui/panel';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTheme } from '@/hooks/useTheme';
import { getLayoutedElements } from '@/lib/auto-layout';
import { createSystemNode } from '@/lib/node-factory';
import { getShortcutKeys } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';
import type { SystemNodeData, SystemNodeType } from '@/types';

import { getFitViewOptions } from './canvas-helpers';
import { canvasPath } from '@/lib/routes';
type GroupName = 'Add component' | 'Actions' | 'Jump to' | 'Go to';

interface CommandItem {
  id: string;
  group: GroupName;
  label: string;
  icon: ReactNode;
  /** Secondary text after the label, e.g. "· Redis". */
  hint?: string;
  /** Right-aligned meta text (category, type). */
  meta?: string;
  keys?: string[];
  /** Show a bare ⏎ when selected. */
  enterHint?: boolean;
  run: () => void;
}

const EMPTY_ADD_LIMIT = 6;
const PROJECT_LIMIT = 5;
const GROUP_ORDER: GroupName[] = ['Add component', 'Actions', 'Jump to', 'Go to'];

function includes(text: string | undefined, q: string) {
  return !!text && text.toLowerCase().includes(q);
}

/** Text with the first case-insensitive match of `query` highlighted. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const index = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[3px] bg-accent-soft px-px text-accent">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}

function ActionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center text-ink-2">
      <Icon className="size-[15px]" />
    </span>
  );
}

export function CommandMenu() {
  const open = useCanvasStore((s) => s.commandMenuOpen);
  const setOpen = useCanvasStore((s) => s.setCommandMenuOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent position="top" className="max-w-[560px]" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        {/* Mounted only while open, so query and selection reset on every open. */}
        <CommandMenuBody onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CommandMenuBody({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { screenToFlowPosition, setCenter, fitView, getInternalNode } = useReactFlow();
  const { toggleTheme } = useTheme();

  const nodes = useCanvasStore((s) => s.nodes);
  const projectId = useCanvasStore((s) => s.projectId);
  const projects = useProjectStore((s) => s.projects);

  const items = useMemo<CommandItem[]>(() => {
    const store = useCanvasStore.getState;
    const q = query.trim().toLowerCase();
    const result: CommandItem[] = [];

    // ── Add component ──
    const addLabelMatches: CommandItem[] = [];
    const addTechMatches: CommandItem[] = [];
    for (const [type, config] of Object.entries(NODE_REGISTRY) as [SystemNodeType, (typeof NODE_REGISTRY)[SystemNodeType]][]) {
      const Icon = config.icon;
      const base = {
        id: `add-${type}`,
        group: 'Add component' as const,
        label: config.label,
        icon: (
          <IconChip color={config.color} size={24}>
            <Icon className="size-[13px]" />
          </IconChip>
        ),
        meta: config.category,
        enterHint: true,
        run: () => {
          const flow = document.querySelector('.react-flow');
          const rect = flow?.getBoundingClientRect();
          const center = rect
            ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
            : { x: 0, y: 0 };
          const isGroup = type === 'group';
          const node = createSystemNode(type, {
            x: center.x - (isGroup ? 160 : 100),
            y: center.y - (isGroup ? 100 : 36),
          });
          const { addNode, setNodes, setSelectedNodeId } = store();
          addNode(node);
          setNodes(store().nodes.map((n) => ({ ...n, selected: n.id === node.id })));
          setSelectedNodeId(node.id);
        },
      };
      if (!q) {
        addLabelMatches.push(base);
        continue;
      }
      if (includes(config.label, q) || includes(type, q) || includes(config.category, q)) {
        addLabelMatches.push(base);
        continue;
      }
      const tech = [...config.defaultTechStack, ...config.suggestedTech].find((t) => includes(t, q));
      if (tech) addTechMatches.push({ ...base, hint: tech });
    }
    const addItems = [...addLabelMatches, ...addTechMatches];
    result.push(...(q ? addItems : addItems.slice(0, EMPTY_ADD_LIMIT)));

    // ── Actions ──
    const actions: CommandItem[] = [
      {
        id: 'action-present',
        group: 'Actions',
        label: 'Present',
        icon: <ActionIcon icon={Presentation} />,
        keys: getShortcutKeys('present'),
        run: () => store().startPresentation(),
      },
      {
        id: 'action-export',
        group: 'Actions',
        label: 'Export…',
        icon: <ActionIcon icon={Download} />,
        run: () => store().setExportOpen(true),
      },
      {
        id: 'action-share',
        group: 'Actions',
        label: 'Share',
        icon: <ActionIcon icon={Share2} />,
        run: () => store().setShareOpen(true),
      },
      {
        id: 'action-auto-layout',
        group: 'Actions',
        label: 'Auto layout',
        icon: <ActionIcon icon={LayoutDashboard} />,
        run: () => {
          const { nodes: current, edges, pushHistory, setNodes, setEdges } = store();
          if (current.length === 0) return;
          pushHistory();
          const layouted = getLayoutedElements(current, edges);
          setNodes(layouted.nodes);
          setEdges(layouted.edges);
          requestAnimationFrame(() => fitView(getFitViewOptions(300)));
        },
      },
      {
        id: 'action-undo',
        group: 'Actions',
        label: 'Undo',
        icon: <ActionIcon icon={Undo2} />,
        keys: getShortcutKeys('undo'),
        run: () => store().undo(),
      },
      {
        id: 'action-redo',
        group: 'Actions',
        label: 'Redo',
        icon: <ActionIcon icon={Redo2} />,
        keys: getShortcutKeys('redo'),
        run: () => store().redo(),
      },
      {
        id: 'action-theme',
        group: 'Actions',
        label: 'Toggle theme',
        icon: <ActionIcon icon={SunMoon} />,
        run: toggleTheme,
      },
      {
        id: 'action-shortcuts',
        group: 'Actions',
        label: 'Keyboard shortcuts',
        icon: <ActionIcon icon={Keyboard} />,
        keys: getShortcutKeys('shortcuts'),
        run: () => store().setShortcutsOpen(true),
      },
    ];
    result.push(...actions.filter((a) => !q || includes(a.label, q)));

    // ── Jump to (components on the canvas) ──
    if (q) {
      for (const node of nodes) {
        if (node.type !== 'system' && node.type !== 'group') continue;
        const data = node.data as SystemNodeData;
        const config = NODE_REGISTRY[data.nodeType];
        if (!config) continue;
        const techMatch = data.techStack.find((t) => includes(t, q));
        const matches =
          includes(data.label, q) ||
          includes(data.nodeType, q) ||
          includes(config.label, q) ||
          !!techMatch ||
          includes(data.description, q) ||
          includes(data.owner, q);
        if (!matches) continue;
        const Icon = config.icon;
        result.push({
          id: `jump-${node.id}`,
          group: 'Jump to',
          label: data.label || config.label,
          hint: !includes(data.label, q) ? techMatch : undefined,
          icon: (
            <IconChip color={config.color} size={24}>
              <Icon className="size-[13px]" />
            </IconChip>
          ),
          meta: config.label,
          run: () => {
            const { setNodes, setSelectedNodeId } = store();
            setNodes(store().nodes.map((n) => ({ ...n, selected: n.id === node.id })));
            setSelectedNodeId(node.id);
            const internal = getInternalNode(node.id);
            const position = internal?.internals.positionAbsolute ?? node.position;
            const width = internal?.measured.width ?? node.measured?.width ?? 200;
            const height = internal?.measured.height ?? node.measured?.height ?? 72;
            setCenter(position.x + width / 2, position.y + height / 2, { zoom: 1.5, duration: 300 });
          },
        });
      }
    }

    // ── Go to ──
    const goTo: CommandItem[] = [
      {
        id: 'goto-projects',
        group: 'Go to',
        label: 'Projects',
        icon: <ActionIcon icon={FolderOpen} />,
        run: () => router.push('/'),
      },
      {
        id: 'goto-settings',
        group: 'Go to',
        label: 'Settings',
        icon: <ActionIcon icon={Settings2} />,
        run: () => router.push('/settings'),
      },
    ];
    result.push(...goTo.filter((g) => !q || includes(g.label, q)));
    if (q) {
      result.push(
        ...projects
          .filter((p) => p.id !== projectId && includes(p.name, q))
          .slice(0, PROJECT_LIMIT)
          .map<CommandItem>((p) => ({
            id: `project-${p.id}`,
            group: 'Go to',
            label: p.name,
            icon: <ActionIcon icon={CornerDownRight} />,
            meta: 'Project',
            run: () => router.push(canvasPath(p.id)),
          }))
      );
    }

    return GROUP_ORDER.flatMap((group) => result.filter((item) => item.group === group));
  }, [query, nodes, projects, projectId, router, screenToFlowPosition, setCenter, fitView, getInternalNode, toggleTheme]);

  const activeIndex = items.length === 0 ? -1 : Math.min(selectedIndex, items.length - 1);

  const select = (index: number) => {
    setSelectedIndex(index);
    listRef.current
      ?.querySelector(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  };

  const runItem = (item: CommandItem) => {
    onClose();
    // Let the dialog unmount and restore focus before the action opens anything new.
    requestAnimationFrame(() => item.run());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      select((activeIndex + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      select((activeIndex - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (items[activeIndex]) runItem(items[activeIndex]);
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-line-2 pr-3.5 pl-4">
        <Search className="size-4 shrink-0 text-ink-3" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            listRef.current?.scrollTo({ top: 0 });
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search components, actions, projects…"
          aria-label="Search components, actions, projects"
          role="combobox"
          aria-expanded
          aria-controls="command-menu-list"
          aria-activedescendant={activeIndex >= 0 ? `command-item-${activeIndex}` : undefined}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-ink-3"
        />
        <Kbd className="h-5 rounded-[5px] bg-transparent px-1.5 text-[11px] text-ink-3">esc</Kbd>
      </div>

      <div
        ref={listRef}
        id="command-menu-list"
        role="listbox"
        className="max-h-[420px] min-h-0 overflow-y-auto p-1.5"
      >
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-[13px] text-ink-3">
            Nothing for “{query.trim()}”
          </p>
        ) : (
          items.map((item, index) => {
            const selected = index === activeIndex;
            const showHeader = index === 0 || items[index - 1].group !== item.group;
            return (
              <Fragment key={item.id}>
                {showHeader && (
                  <div
                    className={cn(
                      'px-[9px] pb-1 text-[11px] font-medium text-ink-3',
                      index === 0 ? 'pt-2' : 'pt-2.5'
                    )}
                  >
                    {item.group}
                  </div>
                )}
                <div
                  id={`command-item-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => {
                    if (!selected) setSelectedIndex(index);
                  }}
                  onClick={() => runItem(item)}
                  className={cn(
                    'flex h-9 cursor-pointer items-center gap-2.5 rounded-[9px] px-[9px] text-[13px] text-ink select-none',
                    selected && 'bg-line-2'
                  )}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1 truncate">
                    <Highlight text={item.label} query={query} />
                    {item.hint && (
                      <span className="text-ink-3">
                        {' · '}
                        <Highlight text={item.hint} query={query} />
                      </span>
                    )}
                  </span>
                  {item.meta && <span className="shrink-0 text-[11.5px] text-ink-3">{item.meta}</span>}
                  {item.keys && item.keys.length > 0 && <KbdCombo keys={item.keys} bare className="shrink-0" />}
                  {item.enterHint && selected && (
                    <Kbd bare className="shrink-0">
                      ⏎
                    </Kbd>
                  )}
                </div>
              </Fragment>
            );
          })
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3.5 border-t border-line-2 bg-bg px-3.5 py-2 text-[11.5px] text-ink-3">
        <span>
          <kbd className="font-mono">↑↓</kbd> navigate
        </span>
        <span>
          <kbd className="font-mono">⏎</kbd> select
        </span>
        <span>
          <kbd className="font-mono">esc</kbd> close
        </span>
      </div>
    </>
  );
}
