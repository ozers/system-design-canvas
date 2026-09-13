'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useIsNarrow } from '@/hooks/useMediaQuery';
import { NODE_REGISTRY, getNodesByCategory } from './node-registry';
import { NODE_ENV_META, NODE_STATUS_META } from './BaseSystemNode';
import { EDGE_REGISTRY } from '@/components/edges/edge-registry';
import {
  NODE_ENVIRONMENTS,
  NODE_STATUSES,
  type NodeEnvironment,
  type SystemNodeData,
  type SystemNodeType,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { SuggestionTag, Tag } from '@/components/ui/tag';
import { Segmented } from '@/components/ui/segmented';
import { IconChip, Panel, PanelBody, PanelFooter, PanelHeader } from '@/components/ui/panel';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const TYPE_GROUPS = getNodesByCategory().filter((group) => group.category !== 'Other');

const ENV_OPTIONS: { value: 'none' | NodeEnvironment; label: string }[] = [
  { value: 'none', label: 'None' },
  ...NODE_ENVIRONMENTS.map((env) => ({ value: env, label: NODE_ENV_META[env].label })),
];

const FOCUS_RING = 'outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] leading-4 font-medium text-ink-2">{children}</span>;
}

/** Only http(s)/mailto links are clickable; bare hosts get https://. */
function safeHref(url: string) {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined;
  return `https://${trimmed}`;
}

function TechStackField({
  value,
  suggestions,
  onChange,
}: {
  value: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const has = (tech: string) => value.some((t) => t.toLowerCase() === tech.toLowerCase());

  const add = (raw: string) => {
    const tech = raw.replace(/,/g, '').trim();
    setDraft('');
    if (!tech || has(tech)) return;
    onChange([...value, tech]);
  };

  const visibleSuggestions = suggestions.filter((s) => !has(s)).slice(0, 3);

  return (
    <div className="grid gap-1.5">
      <SectionLabel>Tech stack</SectionLabel>
      <div
        className="flex min-h-9 cursor-text flex-wrap items-center gap-1.5 rounded-[9px] border border-line p-1.5 transition-[border-color,box-shadow] duration-[120ms] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]"
        onClick={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.focus();
        }}
      >
        {value.map((tech, i) => (
          <Tag key={`${tech}-${i}`} onRemove={() => onChange(value.filter((_, j) => j !== i))}>
            {tech}
          </Tag>
        ))}
        <input
          ref={inputRef}
          aria-label="Add technology"
          value={draft}
          placeholder="Add…"
          className="h-6 min-w-[60px] flex-1 bg-transparent px-1 text-[13px] text-ink outline-none placeholder:text-ink-3"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => add(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
        />
      </div>
      {visibleSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSuggestions.map((tech) => (
            <SuggestionTag key={tech} onClick={() => add(tech)}>
              {tech}
            </SuggestionTag>
          ))}
        </div>
      )}
    </div>
  );
}

function MoreDetails({
  data,
  onChange,
}: {
  data: SystemNodeData;
  onChange: (patch: Partial<SystemNodeData>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const links = data.links ?? [];
  const setCount = [data.status, data.environment, data.owner, links.length].filter(Boolean).length;

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    onChange({ links: [...links, { label: linkLabel.trim() || 'Link', url }] });
    setLinkLabel('');
    setLinkUrl('');
  };

  return (
    <div className="grid gap-3.5 border-t border-line-2 pt-3.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mx-1 flex h-6 items-center gap-1.5 rounded-[6px] px-1 text-left text-[12px] font-medium text-ink-2 transition-colors duration-[120ms] outline-none hover:text-ink focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]"
      >
        <ChevronRight
          className={cn('size-3.5 text-ink-3 transition-transform duration-[120ms]', open && 'rotate-90')}
        />
        More details
        {!open && setCount > 0 && <span className="font-mono text-[11px] font-normal text-ink-3">{setCount} set</span>}
      </button>

      {open && (
        <>
          <div className="grid gap-1.5">
            <SectionLabel>Status</SectionLabel>
            <div className="grid grid-cols-2 gap-1">
              {[undefined, ...NODE_STATUSES].map((status) => {
                const current = data.status === status;
                return (
                  <button
                    key={status ?? 'none'}
                    type="button"
                    aria-pressed={current}
                    onClick={() => onChange({ status })}
                    className={cn(
                      'flex h-8 items-center gap-2 rounded-[9px] border px-2.5 text-left text-[12.5px] whitespace-nowrap text-ink transition-colors duration-[120ms]',
                      FOCUS_RING,
                      current ? 'border-accent bg-accent-soft font-semibold' : 'border-line bg-paper hover:border-ink-3'
                    )}
                  >
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        status ? NODE_STATUS_META[status].dot : 'border border-ink-3'
                      )}
                    />
                    {status ? NODE_STATUS_META[status].label : 'None'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-1.5">
            <SectionLabel>Environment</SectionLabel>
            <Segmented
              aria-label="Environment"
              size="sm"
              className="flex w-full [&>button]:flex-1"
              value={data.environment ?? 'none'}
              options={ENV_OPTIONS}
              onValueChange={(env) => onChange({ environment: env === 'none' ? undefined : env })}
            />
          </div>

          <Field label="Owner / team">
            <Input
              value={data.owner ?? ''}
              placeholder="e.g. Platform Team, @alice"
              onChange={(e) => onChange({ owner: e.target.value })}
            />
          </Field>

          <div className="grid gap-1.5">
            <SectionLabel>Links</SectionLabel>
            {links.length > 0 && (
              <div className="grid gap-0.5">
                {links.map((link, i) => {
                  const href = safeHref(link.url);
                  return (
                    <div key={`${link.url}-${i}`} className="group/link flex h-7 items-center gap-2 text-[12.5px]">
                      <ExternalLink className="size-3 shrink-0 text-ink-3" />
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.url}
                        className="min-w-0 flex-1 truncate text-ink hover:text-accent hover:underline"
                      >
                        {link.label || link.url}
                      </a>
                      <Button
                        variant="icon"
                        size="icon-sm"
                        aria-label={`Remove ${link.label || 'link'}`}
                        className="text-ink-3 opacity-0 group-hover/link:opacity-100 focus-visible:opacity-100"
                        onClick={() => onChange({ links: links.filter((_, j) => j !== i) })}
                      >
                        <X />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                aria-label="Link label"
                value={linkLabel}
                placeholder="Label"
                className="h-8 w-[84px] shrink-0 text-[12.5px]"
                onChange={(e) => setLinkLabel(e.target.value)}
              />
              <Input
                aria-label="Link URL"
                value={linkUrl}
                placeholder="https://…"
                className="h-8 text-[12.5px]"
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLink();
                }}
              />
              <Button variant="secondary" size="icon" aria-label="Add link" disabled={!linkUrl.trim()} onClick={addLink}>
                <Plus />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NodeEditorContent({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const node = useCanvasStore((s) => s.nodes.find((n) => n.id === nodeId));
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const duplicateNodes = useCanvasStore((s) => s.duplicateNodes);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);

  const connections = useMemo(() => {
    const labels = new Map(nodes.map((n) => [n.id, n.data.label]));
    return edges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => {
        const outgoing = e.source === nodeId;
        const type = e.data?.edgeType ?? 'rest';
        return {
          id: e.id,
          outgoing,
          name: labels.get(outgoing ? e.target : e.source) || 'Untitled',
          protocol: e.data?.label || (EDGE_REGISTRY[type] ?? EDGE_REGISTRY.rest).label,
        };
      });
  }, [nodes, edges, nodeId]);

  if (!node) return null;

  const data = node.data;
  const config = NODE_REGISTRY[data.nodeType] ?? NODE_REGISTRY.service;
  const Icon = config.icon;
  const update = (patch: Partial<SystemNodeData>) => updateNodeData(nodeId, patch);

  const handleTypeChange = (nodeType: SystemNodeType) => {
    if (nodeType === data.nodeType) return;
    const techStack = data.techStack ?? [];
    update({
      nodeType,
      techStack: techStack.length === 0 ? [...NODE_REGISTRY[nodeType].defaultTechStack] : techStack,
    });
  };

  return (
    <>
      <PanelHeader
        icon={
          <IconChip color={config.color} size={32}>
            <Icon className="size-4" />
          </IconChip>
        }
        title={data.label || 'Untitled'}
        subtitle={
          <>
            {config.label} · <span className="font-mono">{nodeId}</span>
          </>
        }
        onClose={onClose}
      />

      <PanelBody>
        <Field label="Name">
          <Input value={data.label} onChange={(e) => update({ label: e.target.value })} />
        </Field>

        <div className="grid gap-1.5">
          <SectionLabel>Type</SectionLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-full items-center gap-2.5 rounded-[9px] border border-line bg-paper pr-2.5 pl-2 text-left text-[13.5px] text-ink transition-[border-color,box-shadow] duration-[120ms] outline-none hover:border-ink-3 focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] data-[state=open]:border-accent data-[state=open]:shadow-[0_0_0_3px_var(--accent-soft)]"
              >
                <IconChip color={config.color} size={22}>
                  <Icon className="size-3.5" />
                </IconChip>
                <span className="flex-1 truncate">{config.label}</span>
                <ChevronDown className="size-3.5 text-ink-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-[min(440px,var(--radix-dropdown-menu-content-available-height))] w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              {TYPE_GROUPS.map(({ category, types }, i) => (
                <DropdownMenuGroup key={category}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{category}</DropdownMenuLabel>
                  {types.map(({ type, config: c }) => {
                    const TypeIcon = c.icon;
                    const current = type === data.nodeType;
                    return (
                      <DropdownMenuItem key={type} onSelect={() => handleTypeChange(type)}>
                        <IconChip color={c.color} size={22}>
                          <TypeIcon className="size-3.5" style={{ color: c.color }} />
                        </IconChip>
                        <span className="flex-1 truncate">{c.label}</span>
                        {current && <Check className="size-3.5 text-accent" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TechStackField
          value={data.techStack ?? []}
          suggestions={config.suggestedTech}
          onChange={(techStack) => update({ techStack })}
        />

        <Field label="Description">
          <Textarea
            rows={3}
            value={data.description ?? ''}
            placeholder="What does this component do?"
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>

        <Field label="Presentation note">
          <Textarea
            rows={2}
            value={data.story ?? ''}
            placeholder="Shown on the story card when presenting"
            onChange={(e) => update({ story: e.target.value })}
          />
        </Field>

        <div className="grid gap-1.5">
          <SectionLabel>Connections</SectionLabel>
          {connections.length === 0 ? (
            <span className="text-[12.5px] text-ink-3">No connections yet</span>
          ) : (
            <div className="-mx-1.5 grid gap-0.5">
              {connections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedEdgeId(c.id)}
                  className="flex h-7 items-center gap-2 rounded-[7px] px-1.5 text-left text-[12.5px] text-ink transition-colors duration-[120ms] outline-none hover:bg-line-2 focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]"
                >
                  <span className="text-ink-3" aria-label={c.outgoing ? 'Outgoing' : 'Incoming'}>
                    {c.outgoing ? '→' : '←'}
                  </span>
                  <span className="min-w-0 truncate font-medium">{c.name}</span>
                  <span className="ml-auto shrink-0 rounded-full border border-line px-2 py-px text-[10.5px] leading-[14px] whitespace-nowrap text-ink-2">
                    {c.protocol}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <MoreDetails data={data} onChange={update} />
      </PanelBody>

      <PanelFooter>
        <Button variant="secondary" size="sm" onClick={() => duplicateNodes([nodeId])}>
          <Copy />
          Duplicate
        </Button>
        <Button variant="danger" size="sm" className="ml-auto" onClick={() => deleteNode(nodeId)}>
          <Trash2 />
          Delete
        </Button>
      </PanelFooter>
    </>
  );
}

/**
 * Editor for the selected component. Floating panel on desktop, right drawer on narrow screens.
 * Hidden for groups/notes, multi-selection and presentation mode.
 */
export function NodeEditor() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const isOpen = useCanvasStore((s) => {
    if (s.presentation.active || !s.selectedNodeId) return false;
    const node = s.nodes.find((n) => n.id === s.selectedNodeId);
    if (!node || node.type === 'group' || node.type === 'note' || node.data.nodeType === 'group') return false;
    let selectedCount = 0;
    for (const n of s.nodes) {
      if (n.selected && ++selectedCount >= 2) return false;
    }
    return true;
  });
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const isNarrow = useIsNarrow();

  if (!isOpen || !selectedNodeId) return null;

  const close = () => setSelectedNodeId(null);

  if (isNarrow) {
    return (
      <Sheet open onOpenChange={(open) => !open && close()}>
        <SheetContent side="right" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Edit component</SheetTitle>
          <NodeEditorContent key={selectedNodeId} nodeId={selectedNodeId} onClose={close} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Panel
      role="dialog"
      aria-label="Edit component"
      className="animate-panel-in-right absolute top-4 right-4 bottom-4 z-20 flex w-[300px] flex-col overflow-hidden"
      onKeyDown={(e) => {
        // Radix menus prevent default on the Esc that closes them.
        if (e.key === 'Escape' && !e.defaultPrevented) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <NodeEditorContent key={selectedNodeId} nodeId={selectedNodeId} onClose={close} />
    </Panel>
  );
}
