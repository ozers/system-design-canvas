'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Truck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from '@/stores/useToastStore';
import {
  MAX_MIGRATION_URL_LENGTH,
  MIGRATE_TO,
  buildMigrationUrl,
  shouldOfferMigration,
} from '@/lib/migration';
import { downloadFile, plural } from '@/lib/utils';

const DISMISSED_KEY = 'sdc.migration.dismissedAt';
const MOVED_KEY = 'sdc.migration.movedAt';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

type BannerState = 'hidden' | 'offer' | 'moved';

/** Dashboard banner on the old host inviting users to carry their projects to MIGRATE_TO. */
export function MigrationBanner() {
  const projects = useProjectStore((s) => s.projects);
  const loaded = useProjectStore((s) => s.loaded);
  const [state, setState] = useState<BannerState>('hidden');

  // localStorage is client-only: decide after mount to keep hydration stable.
  useEffect(() => {
    if (!shouldOfferMigration()) return;
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    const next: BannerState = localStorage.getItem(MOVED_KEY)
      ? 'moved'
      : Date.now() - dismissedAt > SNOOZE_MS
        ? 'offer'
        : 'hidden';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage after mount
    setState(next);
  }, []);

  const target = MIGRATE_TO;
  if (state === 'hidden' || !loaded || !target) return null;
  const host = new URL(target).host;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setState('hidden');
  };

  const move = () => {
    if (projects.length === 0) {
      window.location.href = target;
      return;
    }
    const url = buildMigrationUrl(target, projects);
    localStorage.setItem(MOVED_KEY, new Date().toISOString());
    if (url.length > MAX_MIGRATION_URL_LENGTH) {
      // Too big for a link: hand over a backup file instead.
      const blob = new Blob([JSON.stringify({ version: 1, projects }, null, 2)], { type: 'application/json' });
      downloadFile('system-design-canvas-projects.json', blob);
      setState('moved');
      toast({
        message: `Saved a backup — import it on ${host}`,
        tone: 'neutral',
        duration: 8000,
        action: { label: 'Open', onClick: () => window.open(target, '_blank', 'noopener') },
      });
      return;
    }
    window.location.href = url;
  };

  return (
    <div
      role="region"
      aria-label="Moving to a new address"
      className="animate-panel-in mb-8 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] border border-line bg-paper px-4 py-3.5 shadow-[var(--shadow)]"
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
        <Truck className="size-[18px]" />
      </span>
      <div className="min-w-[220px] flex-1">
        {state === 'offer' ? (
          <>
            <div className="text-[13.5px] font-semibold text-ink">
              System Design Canvas is moving to <span className="font-mono text-[12.5px]">{host}</span>
            </div>
            <div className="text-[12.5px] text-pretty text-ink-2">
              {projects.length > 0
                ? `You have ${plural(projects.length, 'project')} in this browser. Move ${projects.length === 1 ? 'it' : 'them'} in one click — nothing is uploaded.`
                : 'Nothing to move from this browser. The new address works the same.'}
            </div>
          </>
        ) : (
          <>
            <div className="text-[13.5px] font-semibold text-ink">Your projects were copied to {host}</div>
            <div className="text-[12.5px] text-ink-2">They also stay here until you clear this browser.</div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {state === 'offer' ? (
          <>
            <Button variant="ghost" onClick={dismiss}>
              Later
            </Button>
            <Button variant="primary" onClick={move}>
              {projects.length > 0 ? 'Move my projects' : `Open ${host}`}
              <ArrowUpRight />
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" asChild>
              <a href={target}>
                Open {host}
                <ArrowUpRight />
              </a>
            </Button>
            <Button variant="icon" size="icon-sm" onClick={dismiss} aria-label="Hide" className="text-ink-3">
              <X />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
