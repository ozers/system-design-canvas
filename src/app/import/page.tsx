'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderInput, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MinimapThumb } from '@/components/shared/MinimapThumb';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { toast } from '@/stores/useToastStore';
import { applyMigratedPreferences, decodeMigrationHash, type MigrationPayload } from '@/lib/migration';
import { plural } from '@/lib/utils';

type State = { kind: 'loading' } | { kind: 'invalid' } | { kind: 'ready'; payload: MigrationPayload };

/** Landing for projects moved from another address: /import#<compressed payload>. */
export default function ImportPage() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const loaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const mergeProjects = useProjectStore((s) => s.mergeProjects);
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  // The hash is only readable on the client.
  useEffect(() => {
    const payload = decodeMigrationHash(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL hash
    setState(payload ? { kind: 'ready', payload } : { kind: 'invalid' });
  }, []);

  const counts = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const here = new Set(projects.map((p) => p.id));
    const fresh = state.payload.projects.filter((p) => !here.has(p.id)).length;
    return { total: state.payload.projects.length, fresh, existing: state.payload.projects.length - fresh };
  }, [state, projects]);

  const preview = state.kind === 'ready' ? state.payload.projects[0] : undefined;

  const handleImport = async () => {
    if (state.kind !== 'ready') return;
    const { added } = mergeProjects(state.payload.projects);
    if (applyMigratedPreferences(state.payload)) {
      await useSettingsStore.persist.rehydrate();
    }
    // Drop the payload from the address bar and history.
    window.history.replaceState(null, '', '/import');
    toast({ message: added > 0 ? `Imported ${plural(added, 'project')}` : 'Everything was already here', tone: 'ok' });
    router.replace('/');
  };

  return (
    <div className="dot-grid flex min-h-screen items-center justify-center p-6">
      {state.kind === 'loading' || !loaded ? null : state.kind === 'invalid' || !counts ? (
        <div className="grid w-full max-w-[300px] justify-items-center gap-2 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-[12px] bg-[color-mix(in_oklch,var(--danger)_12%,transparent)] text-danger">
            <Unlink className="size-5" />
          </span>
          <div className="mt-1 text-[15px] leading-[1.3] font-semibold">Nothing to import</div>
          <p className="text-[12.5px] leading-[1.45] text-pretty text-ink-2">
            This link has no projects in it, or it was cut off. Go back to the old site and try again, or import an
            exported JSON from the dashboard.
          </p>
          <Button variant="secondary" asChild className="mt-1.5">
            <Link href="/">Go to dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="animate-dialog-in w-full max-w-[360px] overflow-hidden rounded-[16px] border border-line bg-paper shadow-[var(--shadow-lg)]">
          <div className="flex h-[130px] items-center justify-center border-b border-line bg-line-2 p-3">
            {preview ? (
              <MinimapThumb nodes={preview.nodes} edges={preview.edges} />
            ) : (
              <FolderInput className="size-6 text-ink-3" />
            )}
          </div>
          <div className="grid gap-3 px-4 pt-3.5 pb-4">
            <div>
              <div className="text-[14px] font-semibold">Bring your projects over</div>
              <div className="font-mono text-[12px] text-ink-3">
                {plural(counts.total, 'project')}
                {counts.existing > 0 && ` · ${counts.existing} already here`}
              </div>
            </div>
            <p className="text-[12.5px] leading-[1.45] text-ink-2">
              {counts.fresh > 0
                ? 'They will be saved in this browser, like before. Nothing is uploaded.'
                : 'All of these projects are already in this browser.'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {counts.fresh > 0 ? (
                <Button variant="primary" onClick={handleImport}>
                  <FolderInput />
                  Import {plural(counts.fresh, 'project')}
                </Button>
              ) : null}
              <Button variant="secondary" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
