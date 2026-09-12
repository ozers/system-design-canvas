'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Keyboard,
  Moon,
  MoreHorizontal,
  Presentation,
  Share2,
  Sun,
} from 'lucide-react';
import { useCanvasStore, type SaveStatus } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTheme } from '@/hooks/useTheme';
import { useIsNarrow } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getShortcutKeys } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';
import { shortcutLabel } from '@/components/canvas/canvas-helpers';

const STATUS: Record<SaveStatus, { label: string; dot: string }> = {
  saved: { label: 'Saved', dot: 'bg-ok' },
  saving: { label: 'Saving…', dot: 'bg-warn animate-status-pulse' },
  error: { label: 'Offline · retrying', dot: 'bg-danger' },
};

/** "Saving…" only when a save takes longer than 300ms; otherwise stay on "Saved". */
function useDisplayedSaveStatus(): SaveStatus {
  const status = useCanvasStore((s) => s.saveStatus);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(status === 'saving'), status === 'saving' ? 300 : 0);
    return () => clearTimeout(t);
  }, [status]);
  if (status === 'saving') return slow ? 'saving' : 'saved';
  return status;
}

function ProjectName({ projectId, name }: { projectId: string; name: string }) {
  const renameProject = useProjectStore((s) => s.renameProject);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const cancelled = useRef(false);

  const start = () => {
    cancelled.current = false;
    setDraft(name);
    setEditing(true);
  };

  const commit = () => {
    if (cancelled.current) return;
    cancelled.current = true;
    setEditing(false);
    const next = draft.trim();
    if (next && next !== name) renameProject(projectId, next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        aria-label="Project name"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancelled.current = true;
            setEditing(false);
          }
        }}
        style={{ width: `${Math.max(draft.length, 6) + 2}ch` }}
        className="-mx-1.5 h-7 max-w-[min(360px,50vw)] min-w-0 rounded-[7px] border border-accent bg-paper px-1.5 text-[13.5px] font-semibold text-ink shadow-[0_0_0_3px_var(--accent-soft)] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      title="Rename"
      className="focus-ring -mx-1.5 h-7 max-w-[min(360px,50vw)] min-w-0 truncate rounded-[7px] border border-transparent px-1.5 text-[13.5px] font-semibold text-ink transition-colors duration-[120ms] hover:bg-line-2"
    >
      {name}
    </button>
  );
}

export function CanvasHeader({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const narrow = useIsNarrow();
  const { theme, toggleTheme } = useTheme();
  const status = useDisplayedSaveStatus();
  const hasComponents = useCanvasStore((s) => s.nodes.some((n) => n.type === 'system'));
  const startPresentation = useCanvasStore((s) => s.startPresentation);
  const setExportOpen = useCanvasStore((s) => s.setExportOpen);
  const setShareOpen = useCanvasStore((s) => s.setShareOpen);
  const setShortcutsOpen = useCanvasStore((s) => s.setShortcutsOpen);
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const themeLabel = theme === 'dark' ? 'Light theme' : 'Dark theme';

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 bg-bg px-4">
      <SimpleTooltip label="Projects">
        <Button variant="icon" asChild>
          <Link href="/" aria-label="Back to projects">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </SimpleTooltip>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
        {!narrow && (
          <>
            <Link
              href="/"
              className="rounded-[6px] text-[13.5px] whitespace-nowrap text-ink-3 transition-colors duration-[120ms] hover:text-ink"
            >
              Projects
            </Link>
            <ChevronRight className="size-[13px] shrink-0 text-ink-3" aria-hidden />
          </>
        )}
        {projectName !== undefined && <ProjectName key={projectName} projectId={projectId} name={projectName} />}
      </nav>

      <span
        className="ml-2 inline-flex shrink-0 items-center gap-[5px] text-[12px] whitespace-nowrap text-ink-3"
        role="status"
        aria-live="polite"
        title={narrow ? STATUS[status].label : undefined}
      >
        <span className={cn('size-1.5 rounded-full', STATUS[status].dot)} />
        {narrow ? <span className="sr-only">{STATUS[status].label}</span> : STATUS[status].label}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {narrow ? (
          <>
            <SimpleTooltip label="Present" keys={getShortcutKeys('present')}>
              <Button variant="icon" onClick={startPresentation} disabled={!hasComponents} aria-label="Present">
                <Presentation className="size-4" />
              </Button>
            </SimpleTooltip>
            <Button variant="primary" size="icon" onClick={() => setShareOpen(true)} aria-label="Share">
              <Share2 className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="icon" aria-label="More">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onSelect={() => setExportOpen(true)}>
                  <Download />
                  Export…
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
                  <Keyboard />
                  Keyboard shortcuts
                  <DropdownMenuShortcut>{shortcutLabel('shortcuts')}</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleTheme}>
                  <ThemeIcon />
                  {themeLabel}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <SimpleTooltip label="Present" keys={getShortcutKeys('present')}>
              <Button variant="ghost" size="sm" onClick={startPresentation} disabled={!hasComponents}>
                <Presentation />
                Present
              </Button>
            </SimpleTooltip>
            <Button variant="ghost" size="sm" onClick={() => setExportOpen(true)}>
              <Download />
              Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 />
              Share
            </Button>
            <SimpleTooltip label={themeLabel}>
              <Button variant="icon" onClick={toggleTheme} aria-label={themeLabel} className="ml-1">
                <ThemeIcon className="size-4" />
              </Button>
            </SimpleTooltip>
          </>
        )}
      </div>
    </header>
  );
}
