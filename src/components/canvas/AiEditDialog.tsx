'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { toast } from '@/stores/useToastStore';
import { buildPrompt, parseDesign, planDesign, toDesign, type DesignDiff } from '@/lib/ai-format';
import { cn, plural } from '@/lib/utils';
import { getFitViewOptions } from './canvas-helpers';

const COPIED_MS = 1800;

export function AiEditDialog() {
  const open = useCanvasStore((s) => s.aiEditOpen);
  const setOpen = useCanvasStore((s) => s.setAiEditOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader className="pb-1">
          <div className="min-w-0 flex-1">
            <DialogTitle>Edit with AI</DialogTitle>
            <DialogDescription>
              Copy a prompt into the assistant you already use, then paste its answer back. Nothing is sent from this page.
            </DialogDescription>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        {/* Mounted only while open: the fields reset and the canvas is read once. */}
        <AiEditBody onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StepLabel({ step, htmlFor, children }: { step: number; htmlFor: string; children: ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-2">
      <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-line-2 font-mono text-[10.5px] text-ink-2">
        {step}
      </span>
      {children}
    </Label>
  );
}

function AiEditBody({ onClose }: { onClose: () => void }) {
  const { fitView } = useReactFlow();
  // The dialog is modal, so the canvas cannot change underneath it.
  const [canvas] = useState(() => {
    const { nodes, edges } = useCanvasStore.getState();
    return { nodes, edges };
  });
  const [request, setRequest] = useState('');
  const [answer, setAnswer] = useState('');
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const result = useMemo(() => {
    if (!answer.trim()) return null;
    const parsed = parseDesign(answer);
    if (!parsed.ok) return { errors: parsed.errors };
    return { plan: planDesign(parsed.design, canvas.nodes, canvas.edges) };
  }, [answer, canvas]);

  const plan = result && 'plan' in result ? result.plan : null;
  const errors = result && 'errors' in result ? result.errors : null;
  const removed = plan ? plan.diff.removedNodes.length : 0;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildPrompt(toDesign(canvas.nodes, canvas.edges), request));
    } catch {
      toast({ message: "Couldn't copy prompt", tone: 'danger' });
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const apply = () => {
    if (!plan || plan.diff.empty) return;
    const { pushHistory, setNodes, setEdges, undo } = useCanvasStore.getState();
    pushHistory();
    setNodes(plan.nodes);
    setEdges(plan.edges);
    useCanvasStore.setState({ selectedNodeId: null, selectedEdgeId: null });
    onClose();
    if (plan.diff.addedNodes.length > 0) requestAnimationFrame(() => fitView(getFitViewOptions(300)));
    toast({ message: 'Design updated', tone: 'ok', action: { label: 'Undo', onClick: undo } });
  };

  return (
    <>
      <DialogBody className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <div className="grid gap-2">
          <StepLabel step={1} htmlFor="ai-edit-request">
            What should change?
          </StepLabel>
          <Textarea
            id="ai-edit-request"
            rows={2}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Add a read replica and put a cache in front of the database"
            className="min-h-[60px]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={copyPrompt}>
              {copied ? <Check className="text-ok" /> : <Copy />}
              {copied ? 'Copied' : 'Copy prompt'}
            </Button>
            <span className="text-[12px] text-ink-3">The format guide, this design and your request.</span>
          </div>
        </div>

        <div className="grid gap-2">
          <StepLabel step={2} htmlFor="ai-edit-answer">
            Paste the answer
          </StepLabel>
          <Textarea
            id="ai-edit-answer"
            rows={5}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={'```json\n{ "format": "sdc/design@1", "nodes": [...], "edges": [...] }\n```'}
            spellCheck={false}
            className="max-h-[200px] min-h-[104px] font-mono text-[12px]"
          />
        </div>

        <div aria-live="polite">
          {errors && (
            <div className="grid gap-1.5 rounded-[10px] bg-[color-mix(in_oklch,var(--danger)_9%,transparent)] px-3 py-2.5 text-[12.5px] leading-[1.45] text-ink-2">
              <div className="flex items-center gap-1.5 font-medium text-ink">
                <TriangleAlert className="size-3.5 shrink-0 text-danger" />
                This answer can&apos;t be applied
              </div>
              <ul className="grid gap-1">
                {errors.map((error) => (
                  <li key={error} className="break-words">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan && <DiffSummary diff={plan.diff} />}
        </div>
      </DialogBody>
      <DialogFooter className="justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={apply} disabled={!plan || plan.diff.empty}>
          {removed > 0 ? `Apply · removes ${plural(removed, 'component')}` : 'Apply'}
        </Button>
      </DialogFooter>
    </>
  );
}

type Mark = '+' | '−' | '~';

const MARK_CLASS: Record<Mark, string> = { '+': 'text-ok', '−': 'text-danger', '~': 'text-ink-3' };

function DiffSummary({ diff }: { diff: DesignDiff }) {
  if (diff.empty) {
    return (
      <div className="rounded-[10px] border border-line px-3 py-2.5 text-[12.5px] text-ink-2">
        No changes. The pasted design matches the canvas.
      </div>
    );
  }

  const rows: { mark: Mark; text: string; detail?: string }[] = [
    ...diff.addedNodes.map((label) => ({ mark: '+' as const, text: label })),
    ...diff.removedNodes.map((label) => ({ mark: '−' as const, text: label })),
    ...diff.changedNodes.map((node) => ({ mark: '~' as const, text: node.label, detail: node.fields.join(', ') })),
    ...diff.addedEdges.map((label) => ({ mark: '+' as const, text: label })),
    ...diff.removedEdges.map((label) => ({ mark: '−' as const, text: label })),
    ...diff.changedEdges.map((label) => ({ mark: '~' as const, text: label })),
  ];
  const nodeCounts = [
    diff.addedNodes.length && `+${diff.addedNodes.length}`,
    diff.removedNodes.length && `−${diff.removedNodes.length}`,
    diff.changedNodes.length && `~${diff.changedNodes.length}`,
  ].filter(Boolean);
  const edgeCounts = [
    diff.addedEdges.length && `+${diff.addedEdges.length}`,
    diff.removedEdges.length && `−${diff.removedEdges.length}`,
    diff.changedEdges.length && `~${diff.changedEdges.length}`,
  ].filter(Boolean);

  return (
    <div className="rounded-[10px] border border-line">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-2 px-3 py-2 text-[12px] text-ink-2">
        {nodeCounts.length > 0 && (
          <span>
            Components <span className="font-mono text-ink">{nodeCounts.join(' ')}</span>
          </span>
        )}
        {edgeCounts.length > 0 && (
          <span>
            Connections <span className="font-mono text-ink">{edgeCounts.join(' ')}</span>
          </span>
        )}
        {diff.relayout && <span className="text-ink-3">Canvas will be laid out again</span>}
      </div>
      <ul className="max-h-[168px] overflow-y-auto px-3 py-2 text-[12.5px] leading-[1.5]">
        {rows.map((row, i) => (
          <li key={i} className="flex min-w-0 items-baseline gap-2">
            <span aria-hidden className={cn('w-3 shrink-0 text-center font-mono', MARK_CLASS[row.mark])}>
              {row.mark}
            </span>
            <span className="sr-only">{row.mark === '+' ? 'Added' : row.mark === '−' ? 'Removed' : 'Changed'}</span>
            <span className="min-w-0 truncate text-ink">{row.text}</span>
            {row.detail && <span className="shrink-0 font-mono text-[11.5px] text-ink-3">{row.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
