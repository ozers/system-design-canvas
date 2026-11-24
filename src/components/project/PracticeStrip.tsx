'use client';

import { BRIEFS, type Brief } from '@/lib/briefs';
import { evaluateChecks } from '@/lib/brief-checks';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

const DIFFICULTY_DOT: Record<Brief['difficulty'], string> = {
  easy: 'bg-ok',
  medium: 'bg-warn',
  hard: 'bg-danger',
};

/** One brief as a card: title, difficulty, summary and tags. `progress` shows on the right of the tags. */
export function BriefCard({
  brief,
  onSelect,
  progress,
  done = false,
  className,
}: {
  brief: Brief;
  onSelect: (briefId: string) => void;
  progress?: string;
  done?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(brief.id)}
      className={cn(
        'focus-ring flex min-w-0 flex-col gap-2 rounded-[12px] border border-line bg-paper p-3.5 text-left transition-[border-color,box-shadow] duration-[120ms] hover:border-ink-3 hover:shadow-[var(--shadow)]',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[13.5px] leading-[18px] font-semibold text-ink">{brief.title}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] text-ink-3">
          <span aria-hidden className={cn('size-1.5 rounded-full', DIFFICULTY_DOT[brief.difficulty])} />
          {brief.difficulty}
        </span>
      </div>
      <p className="line-clamp-2 min-h-8 text-[12px] leading-4 text-ink-2">{brief.summary}</p>
      <div className="flex items-center gap-2 font-mono text-[11px] leading-4 text-ink-3">
        <span className="min-w-0 flex-1 truncate">{brief.tags.join(' · ')}</span>
        {progress && <span className={cn('shrink-0', done && 'text-ok')}>{progress}</span>}
      </div>
    </button>
  );
}

interface PracticeStripProps {
  projects: Project[];
  onSelect: (briefId: string) => void;
}

/** Dashboard practice briefs. A brief that already has a project shows how far it got. */
export function PracticeStrip({ projects, onSelect }: PracticeStripProps) {
  return (
    <section aria-labelledby="practice-heading">
      <div className="mb-3 flex h-7 items-baseline gap-2">
        <h2 id="practice-heading" className="text-[13px] font-medium text-ink-2">
          Practice a design
        </h2>
        <span className="text-[12px] text-ink-3">Requirements, an empty canvas and a checklist.</span>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {BRIEFS.map((brief) => {
          const project = projects.find((p) => p.briefId === brief.id);
          const passed = project ? evaluateChecks(brief.checks, project.nodes, project.edges).filter((c) => c.pass).length : 0;
          const done = !!project && passed === brief.checks.length;
          return (
            <BriefCard
              key={brief.id}
              brief={brief}
              onSelect={onSelect}
              progress={project ? `${passed}/${brief.checks.length}` : undefined}
              done={done}
            />
          );
        })}
      </div>
    </section>
  );
}
