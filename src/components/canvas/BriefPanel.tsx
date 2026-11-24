'use client';

import { useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Check, ChevronUp, ClipboardList, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Panel } from '@/components/ui/panel';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { toast } from '@/stores/useToastStore';
import { planDesign } from '@/lib/ai-format';
import { evaluateChecks } from '@/lib/brief-checks';
import type { Brief } from '@/lib/briefs';
import { cn } from '@/lib/utils';
import type { SystemEdge, SystemNode } from '@/types';
import { getFitViewOptions } from './canvas-helpers';

/** Width of the node/edge editor plus its margin; the brief moves left of it. */
const EDITOR_SPACE = 348;

interface BriefPanelProps {
  brief: Brief;
  nodes: SystemNode[];
  edges: SystemEdge[];
  editorOpen: boolean;
  narrow: boolean;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1.5 text-[11.5px] leading-4 font-medium text-ink-3">{children}</h3>;
}

/** Practice brief for the open project: requirements, a live checklist, hints and the reference design. */
export function BriefPanel({ brief, nodes, edges, editorOpen, narrow }: BriefPanelProps) {
  const { fitView } = useReactFlow();
  // On a narrow screen the open panel covers the canvas, so until the user toggles it, it is open
  // only while there is nothing on the canvas yet.
  const [userOpen, setOpen] = useState<boolean | null>(null);
  const open = userOpen ?? (!narrow || nodes.length === 0);
  const [hints, setHints] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const results = useMemo(() => evaluateChecks(brief.checks, nodes, edges), [brief, nodes, edges]);
  const passed = results.filter((result) => result.pass).length;
  const done = passed === results.length;
  // Beside an open editor there is only room for the pill.
  const expanded = open && !editorOpen;

  const showReference = () => {
    const { pushHistory, setNodes, setEdges, undo } = useCanvasStore.getState();
    const keep = nodes.filter((node) => node.type === 'group' || node.type === 'note');
    const plan = planDesign(brief.reference, keep, []);
    pushHistory();
    setNodes(plan.nodes);
    setEdges(plan.edges);
    useCanvasStore.setState({ selectedNodeId: null, selectedEdgeId: null });
    setConfirming(false);
    if (narrow) setOpen(false);
    requestAnimationFrame(() => fitView(getFitViewOptions(300)));
    toast({ message: 'Showing the reference design', tone: 'ok', duration: 6000, action: { label: 'Undo', onClick: undo } });
  };

  const count = (
    <span className={cn('font-mono text-[11.5px]', done ? 'text-ok' : 'text-ink-3')}>
      {passed}/{results.length}
    </span>
  );

  return (
    <>
      {!expanded ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={editorOpen}
          aria-label={`Brief: ${brief.title}, ${passed} of ${results.length} checks`}
          className={cn(
            'absolute z-10 inline-flex h-10 items-center gap-2 rounded-full border border-line bg-paper pr-3.5 pl-3 text-[13px] font-medium whitespace-nowrap text-ink shadow-[var(--shadow-lg)] outline-none transition-[border-color] duration-[120ms] hover:border-ink-3 focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] disabled:pointer-events-none',
            narrow ? 'top-16 left-3' : 'top-4'
          )}
          style={narrow ? undefined : { right: editorOpen ? EDITOR_SPACE : 16 }}
        >
          <ClipboardList className="size-[15px] text-ink-3" />
          Brief
          {count}
        </button>
      ) : (
        <Panel
          role="region"
          aria-label={`Brief: ${brief.title}`}
          className={cn(
            'animate-panel-in absolute z-10 flex flex-col overflow-hidden',
            narrow ? 'top-16 right-3 left-3 max-h-[min(62dvh,520px)]' : 'top-4 right-4 max-h-[calc(100%-168px)] w-[320px]'
          )}
        >
          <div className="flex items-center gap-2 border-b border-line-2 py-2.5 pr-2 pl-3.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] leading-[18px] font-semibold">{brief.title}</div>
              <div className="truncate text-[11.5px] leading-[14px] text-ink-3">
                Practice · {brief.difficulty}
              </div>
            </div>
            {count}
            <Button variant="icon" size="icon-sm" aria-label="Collapse brief" onClick={() => setOpen(false)} className="text-ink-3">
              <ChevronUp />
            </Button>
          </div>

          <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-3.5 text-[12.5px] leading-[1.45]">
            <p className="text-ink-2">{brief.summary}</p>

            <section>
              <SectionTitle>Requirements</SectionTitle>
              <ul className="grid list-disc gap-1 pl-4 text-ink marker:text-ink-3">
                {brief.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <SectionTitle>Design for</SectionTitle>
              <ul className="grid list-disc gap-1 pl-4 text-ink marker:text-ink-3">
                {brief.scale.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section aria-live="polite">
              <SectionTitle>Checklist</SectionTitle>
              <ul className="grid gap-1.5">
                {results.map((result) => (
                  <li key={result.id} className="flex items-start gap-2">
                    <span
                      className={cn(
                        'mt-px inline-flex size-4 shrink-0 items-center justify-center rounded-full border',
                        result.pass ? 'border-ok bg-ok text-[oklch(0.15_0.03_150)]' : 'border-line'
                      )}
                    >
                      {result.pass && <Check className="size-2.5" strokeWidth={3} />}
                    </span>
                    <span className={result.pass ? 'text-ink-2' : 'text-ink'}>
                      <span className="sr-only">{result.pass ? 'Done: ' : 'To do: '}</span>
                      {result.label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11.5px] text-ink-3">
                Checks look at component types and connections. A good design can do it another way.
              </p>
            </section>

            {hints > 0 && (
              <section>
                <SectionTitle>Hints</SectionTitle>
                <ul className="grid gap-1.5">
                  {brief.hints.slice(0, hints).map((hint) => (
                    <li key={hint} className="rounded-[9px] bg-line-2 px-2.5 py-2 text-ink-2">
                      {hint}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-line-2 px-3.5 py-2.5">
            <Button variant="secondary" onClick={() => setHints((n) => n + 1)} disabled={hints >= brief.hints.length}>
              <Lightbulb />
              {hints >= brief.hints.length ? 'No more hints' : 'Hint'}
              {hints < brief.hints.length && (
                <span className="font-mono text-[11px] text-ink-3">
                  {hints}/{brief.hints.length}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(true)} className="ml-auto">
              Show reference
            </Button>
          </div>
        </Panel>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Show the reference design?</DialogTitle>
          </DialogHeader>
          <DialogBody className="pt-1.5">
            <DialogDescription className="mt-0 text-[13px]">
              It replaces what is on the canvas. Undo brings your design back, as long as you stay on this page.
            </DialogDescription>
          </DialogBody>
          <DialogFooter className="justify-end border-t-0 pt-0">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={showReference}>
              Show reference
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
