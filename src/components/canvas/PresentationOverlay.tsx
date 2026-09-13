'use client';

import { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Boxes, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { IconChip, Panel } from '@/components/ui/panel';
import { cn } from '@/lib/utils';
import type { SystemNode } from '@/types';

/** Chrome for presentation mode. `order` is the BFS walk computed by Canvas. */
export function PresentationOverlay({ order, projectName }: { order: SystemNode[]; projectName?: string }) {
  const index = useCanvasStore((s) => s.presentation.index);
  const setIndex = useCanvasStore((s) => s.setPresentationIndex);
  const stop = useCanvasStore((s) => s.stopPresentation);
  const { setCenter, getInternalNode, getZoom } = useReactFlow();
  const [hintFaded, setHintFaded] = useState(false);

  const count = order.length;
  const current = count > 0 ? order[Math.min(index, count - 1)] : undefined;
  const step = current ? Math.min(index, count - 1) : 0;
  const currentId = current?.id;

  useEffect(() => {
    const t = setTimeout(() => setHintFaded(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!currentId) return;
    const node = getInternalNode(currentId);
    if (!node) return;
    const { x, y } = node.internals.positionAbsolute;
    const width = node.measured.width ?? 200;
    const height = node.measured.height ?? 72;
    const zoom = Math.min(1.2, Math.max(0.8, getZoom()));
    setCenter(x + width / 2, y + height / 2, { zoom, duration: 400 });
  }, [currentId, getInternalNode, getZoom, setCenter]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const { presentation } = useCanvasStore.getState();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setIndex(Math.min(presentation.index + 1, Math.max(count - 1, 0)));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(Math.max(presentation.index - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [count, setIndex]);

  const data = current?.data;
  const config = data ? NODE_REGISTRY[data.nodeType] : undefined;
  const Icon = config?.icon;
  const subtitle = data && config ? (data.techStack.length > 0 ? data.techStack.join(' · ') : config.label) : '';
  const story = data?.story || data?.description || 'No story yet — add a presentation note in the editor.';

  return (
    <>
      <div
        className={cn(
          'absolute top-5 left-5 z-20 flex items-center gap-2.5 text-[13px] transition-opacity duration-300',
          hintFaded ? 'opacity-0 hover:opacity-100' : 'opacity-100'
        )}
      >
        <span className="inline-flex size-[22px] items-center justify-center rounded-[7px] bg-accent text-accent-ink">
          <Boxes className="size-[13px]" />
        </span>
        {projectName && <span className="font-semibold">{projectName}</span>}
        {count > 0 && (
          <span className="font-mono text-[12px] text-ink-3">
            {step + 1} / {count}
          </span>
        )}
      </div>

      <Button variant="secondary" size="sm" onClick={stop} className="absolute top-5 right-5 z-20 text-ink-2 hover:text-ink">
        <X />
        Exit
        <Kbd bare>esc</Kbd>
      </Button>

      {current && data && config && Icon && (
        <Panel key={current.id} className="animate-panel-in absolute right-5 bottom-[76px] z-20 grid w-80 max-w-[calc(100%-40px)] gap-2 px-[18px] py-4">
          <div className="flex items-center gap-2.5">
            <IconChip color={config.color} size={28}>
              <Icon className="size-[15px]" />
            </IconChip>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold">{data.label || config.label}</div>
              <div className="truncate text-[11.5px] text-ink-3">{subtitle}</div>
            </div>
          </div>
          <p className="text-[13px] text-pretty text-ink-2">{story}</p>
        </Panel>
      )}

      <div
        role="toolbar"
        aria-label="Presentation controls"
        className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-paper p-[5px] shadow-[var(--shadow-lg)]"
      >
        <Button
          variant="icon"
          size="icon-toolbar"
          aria-label="Previous"
          disabled={step === 0}
          onClick={() => setIndex(Math.max(step - 1, 0))}
        >
          <ChevronLeft />
        </Button>
        <div className="flex max-w-[50vw] items-center gap-[5px] overflow-hidden px-2.5">
          {order.map((node, i) => (
            <button
              key={node.id}
              type="button"
              aria-label={`Go to ${node.data.label || i + 1}`}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 shrink-0 rounded-full transition-[width,background-color] duration-200',
                i === step ? 'w-[18px] bg-accent' : i < step ? 'w-1.5 bg-ink-3' : 'w-1.5 bg-line'
              )}
            />
          ))}
        </div>
        <Button
          variant="icon"
          size="icon-toolbar"
          aria-label="Next"
          disabled={step >= count - 1}
          onClick={() => setIndex(Math.min(step + 1, Math.max(count - 1, 0)))}
        >
          <ChevronRight />
        </Button>
        <div aria-hidden className="mx-1.5 h-[18px] w-px bg-line" />
        <Button variant="icon" size="icon-toolbar" aria-label="Exit presentation" onClick={stop}>
          <X />
        </Button>
      </div>
    </>
  );
}
