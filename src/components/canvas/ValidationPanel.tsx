'use client';

import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { ChevronDown, Info, Locate, TriangleAlert } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { Panel } from '@/components/ui/panel';
import { cn } from '@/lib/utils';
import type { ValidationIssue } from '@/lib/validation';

/** Top-center design checks, centered in the area left of an open editor panel. */
export function ValidationPanel({ issues, editorOpen }: { issues: ValidationIssue[]; editorOpen: boolean }) {
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const { setCenter, getInternalNode } = useReactFlow();
  const [expanded, setExpanded] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const issueKey = issues.map((i) => i.id).join('|');
  if (issues.length === 0 || issueKey === dismissedKey) return null;

  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const infos = issues.length - warnings;
  const counts = [warnings > 0 && `${warnings} warn`, infos > 0 && `${infos} info`].filter(Boolean).join(' · ');

  const locate = (nodeId: string) => {
    const node = getInternalNode(nodeId);
    if (!node) return;
    setSelectedNodeId(nodeId);
    const { x, y } = node.internals.positionAbsolute;
    const width = node.measured.width ?? 200;
    const height = node.measured.height ?? 72;
    setCenter(x + width / 2, y + height / 2, { zoom: 1.5, duration: 300 });
  };

  return (
    <Panel
      className="animate-panel-in absolute top-4 z-10 w-[340px] -translate-x-1/2 overflow-hidden"
      style={{
        left: editorOpen ? 'calc((100% - 332px) / 2)' : '50%',
        maxWidth: editorOpen ? 'calc(100% - 364px)' : 'calc(100% - 32px)',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex h-10 w-full items-center gap-2 pr-3 pl-3.5 text-left text-[13px] font-medium whitespace-nowrap text-ink outline-none focus-visible:bg-line-2"
      >
        {warnings > 0 ? (
          <TriangleAlert className="size-[15px] shrink-0 text-warn" />
        ) : (
          <Info className="size-[15px] shrink-0 text-ink-3" />
        )}
        <span className="truncate">
          {issues.length} {issues.length === 1 ? 'thing' : 'things'} to check
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-ink-3">{counts}</span>
          <ChevronDown
            className={cn('size-3.5 text-ink-3 transition-transform duration-[120ms]', expanded && 'rotate-180')}
          />
        </span>
      </button>
      {expanded && (
        <div className="grid max-h-[min(50vh,380px)] gap-0.5 overflow-y-auto border-t border-line-2 p-1.5">
          {issues.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => locate(issue.nodeId)}
              className="flex min-h-9 w-full items-start gap-2.5 rounded-[9px] p-2 text-left text-[12.5px] leading-[1.4] text-ink outline-none transition-colors duration-[120ms] hover:bg-line-2 focus-visible:bg-line-2"
            >
              <span
                className={cn(
                  'mt-[5px] size-[7px] shrink-0 rounded-full',
                  issue.severity === 'warning' ? 'bg-warn' : 'bg-ink-3'
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="font-medium">{issue.nodeLabel}</span>
                <span className="text-ink-2"> {issue.message}</span>
              </span>
              <Locate className="mt-0.5 size-[13px] shrink-0 text-ink-3" aria-label="Locate" />
            </button>
          ))}
          <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-1 text-[11.5px] text-ink-3">
            <span className="truncate">Checks run on every change</span>
            <button
              type="button"
              onClick={() => setDismissedKey(issueKey)}
              className="shrink-0 rounded-[4px] font-medium whitespace-nowrap text-ink-2 outline-none transition-colors duration-[120ms] hover:text-ink focus-visible:text-ink"
            >
              Dismiss all
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
