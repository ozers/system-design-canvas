'use client';

import { Activity, ArrowLeftRight, Clock, FileJson, Trash2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useIsNarrow } from '@/hooks/useMediaQuery';
import { EDGE_REGISTRY } from './edge-registry';
import { ProtocolSwatch } from './ProtocolPicker';
import { SYSTEM_EDGE_TYPES, type SystemEdgeData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Kbd } from '@/components/ui/kbd';
import { Panel, PanelBody, PanelFooter, PanelHeader } from '@/components/ui/panel';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn, tint } from '@/lib/utils';

const DETAILS = [
  { key: 'latency', label: 'Latency', icon: Clock, placeholder: 'e.g. ~50ms' },
  { key: 'dataFormat', label: 'Format', icon: FileJson, placeholder: 'e.g. Protobuf' },
  { key: 'throughput', label: 'Throughput', icon: Activity, placeholder: 'e.g. 1K req/s' },
] as const satisfies readonly { key: keyof SystemEdgeData; label: string; icon: unknown; placeholder: string }[];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] leading-4 font-medium text-ink-2">{children}</span>;
}

function EdgeEditorContent({ edgeId, onClose }: { edgeId: string; onClose: () => void }) {
  const edge = useCanvasStore((s) => s.edges.find((e) => e.id === edgeId));
  const sourceLabel = useCanvasStore((s) => s.nodes.find((n) => n.id === edge?.source)?.data.label);
  const targetLabel = useCanvasStore((s) => s.nodes.find((n) => n.id === edge?.target)?.data.label);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const reverseEdge = useCanvasStore((s) => s.reverseEdge);

  if (!edge) return null;

  const data: SystemEdgeData = edge.data ?? { edgeType: 'rest' };
  const config = EDGE_REGISTRY[data.edgeType] ?? EDGE_REGISTRY.rest;
  const update = (patch: Partial<SystemEdgeData>) => updateEdgeData(edgeId, patch);

  return (
    <>
      <PanelHeader
        icon={
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px]"
            style={{ background: tint(config.color) }}
          >
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: config.color }} />
          </span>
        }
        title={`${sourceLabel || 'Untitled'} → ${targetLabel || 'Untitled'}`}
        subtitle={
          <>
            Connection · <span className="font-mono">{edgeId}</span>
          </>
        }
        onClose={onClose}
      />

      <PanelBody>
        <Field label="Label">
          <Input value={data.label ?? ''} placeholder="e.g. HTTPS" onChange={(e) => update({ label: e.target.value })} />
        </Field>

        <div className="grid gap-1.5">
          <SectionLabel>Protocol</SectionLabel>
          <div role="radiogroup" aria-label="Protocol" className="grid grid-cols-2 gap-1">
            {SYSTEM_EDGE_TYPES.map((type) => {
              const checked = type === data.edgeType;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => !checked && update({ edgeType: type })}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-[9px] border px-2.5 text-left text-[12.5px] whitespace-nowrap text-ink transition-colors duration-[120ms] outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]',
                    checked ? 'border-accent bg-accent-soft font-semibold' : 'border-line bg-paper hover:border-ink-3'
                  )}
                >
                  <ProtocolSwatch type={type} width={14} />
                  <span className="truncate">{EDGE_REGISTRY[type].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Description">
          <Textarea
            rows={2}
            value={data.description ?? ''}
            placeholder="What does this connection do?"
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>

        <div className="grid gap-2">
          <SectionLabel>Details</SectionLabel>
          <div className="overflow-hidden rounded-[9px] border border-line">
            {DETAILS.map(({ key, label, icon: Icon, placeholder }, i) => (
              <label
                key={key}
                className={cn('grid h-9 grid-cols-[112px_1fr] items-center', i > 0 && 'border-t border-line-2')}
              >
                <span className="inline-flex items-center gap-[7px] pl-2.5 text-[12px] text-ink-2">
                  <Icon className="size-[13px] text-ink-3" />
                  {label}
                </span>
                <input
                  value={data[key] ?? ''}
                  placeholder={placeholder}
                  onChange={(e) => update({ [key]: e.target.value })}
                  className="h-full min-w-0 border-0 border-l border-line-2 bg-transparent px-2.5 font-mono text-[12px] text-ink transition-colors duration-[120ms] outline-none placeholder:text-ink-3 focus:bg-line-2"
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => reverseEdge(edgeId)}
          className="flex w-full items-center gap-2 rounded-[9px] bg-line-2 px-3 py-2.5 text-left text-[12px] text-ink-2 transition-colors duration-[120ms] outline-none hover:text-ink focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]"
        >
          <ArrowLeftRight className="size-3.5 text-ink-3" />
          <span className="flex-1">Reverse direction</span>
          <Kbd bare>⇧R</Kbd>
        </button>
      </PanelBody>

      <PanelFooter>
        <span className="text-[11.5px] text-ink-3">Shown on the edge as a pill label</span>
        <Button variant="danger" size="sm" className="ml-auto" onClick={() => deleteEdge(edgeId)}>
          <Trash2 />
          Delete
        </Button>
      </PanelFooter>
    </>
  );
}

/** Editor for the selected connection. Floating panel on desktop, right drawer on narrow screens. */
export function EdgeEditor() {
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const isOpen = useCanvasStore(
    (s) => !s.presentation.active && !!s.selectedEdgeId && s.edges.some((e) => e.id === s.selectedEdgeId)
  );
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);
  const isNarrow = useIsNarrow();

  if (!isOpen || !selectedEdgeId) return null;

  const close = () => setSelectedEdgeId(null);

  if (isNarrow) {
    return (
      <Sheet open onOpenChange={(open) => !open && close()}>
        <SheetContent side="right" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Edit connection</SheetTitle>
          <EdgeEditorContent key={selectedEdgeId} edgeId={selectedEdgeId} onClose={close} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Panel
      role="dialog"
      aria-label="Edit connection"
      className="animate-panel-in-right absolute top-4 right-4 bottom-4 z-20 flex w-[300px] flex-col overflow-hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !e.defaultPrevented) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <EdgeEditorContent key={selectedEdgeId} edgeId={selectedEdgeId} onClose={close} />
    </Panel>
  );
}
