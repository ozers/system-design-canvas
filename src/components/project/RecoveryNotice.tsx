'use client';

import { useEffect, useState } from 'react';
import { Download, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildRecoveryExport, dismissRecovery, getRecoveryState, type RecoveryState } from '@/lib/storage';
import { useProjectStore } from '@/stores/useProjectStore';
import { downloadFile } from '@/lib/utils';

/** Small, non-blocking note when the last load kept unreadable projects aside (quarantine + backup). */
export function RecoveryNotice() {
  const loaded = useProjectStore((s) => s.loaded);
  const [state, setState] = useState<RecoveryState | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage once projects are loaded
    if (loaded) setState(getRecoveryState());
  }, [loaded]);

  if (!state) return null;

  const message =
    state.quarantined > 0
      ? `${state.quarantined} project${state.quarantined === 1 ? '' : 's'} could not be read; a backup was kept.`
      : 'Saved projects could not be read; a backup was kept.';

  const download = () => {
    const blob = new Blob([buildRecoveryExport()], { type: 'application/json' });
    downloadFile(`system-design-canvas-recovery-${new Date().toISOString().slice(0, 10)}.json`, blob);
  };

  const dismiss = () => {
    dismissRecovery();
    setState(null);
  };

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border border-line bg-paper px-3.5 py-2.5 text-[12.5px] text-ink-2 shadow-[var(--shadow)]"
    >
      <TriangleAlert aria-hidden className="size-4 shrink-0 text-warn" />
      <span className="min-w-[180px] flex-1 text-pretty">{message}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={download}>
          <Download />
          Download backup
        </Button>
        <Button variant="icon" size="icon-sm" onClick={dismiss} aria-label="Dismiss" className="text-ink-3">
          <X />
        </Button>
      </div>
    </div>
  );
}
