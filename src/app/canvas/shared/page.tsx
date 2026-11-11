'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderInput, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MinimapThumb } from '@/components/shared/MinimapThumb';
import { countComponents, createProjectWithContent } from '@/components/project/project-io';
import { decodeCanvasFromUrl, readSharePayload, sharedPath } from '@/lib/share';
import { formatBytes, plural } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';

import { canvasPath, DASHBOARD_PATH } from '@/lib/routes';

/** Payload from the address bar; undefined until read on the client (the fragment never reaches the server). */
function useSharePayload(): string | null | undefined {
  const [data, setData] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const read = () => {
      const found = readSharePayload(window.location.search, window.location.hash);
      // Old ?d= links: keep them working, but move the payload into the fragment.
      if (found?.legacy) window.history.replaceState(window.history.state, '', sharedPath(found.encoded));
      setData(found?.encoded ?? null);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return data;
}

function SharedCanvasInner() {
  const router = useRouter();
  const loaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const [opening, setOpening] = useState(false);

  const data = useSharePayload();
  const result = useMemo(() => (data ? decodeCanvasFromUrl(data) : null), [data]);

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  if (data === undefined) return null;

  if (!result || !result.ok || !data) {
    const invalid = result?.ok === false && result.error === 'invalid';
    return (
      <div className="grid w-full max-w-[300px] justify-items-center gap-2 text-center">
        <span className="inline-flex size-11 items-center justify-center rounded-[12px] bg-[color-mix(in_oklch,var(--danger)_12%,transparent)] text-danger">
          <Unlink className="size-5" />
        </span>
        <h1 className="mt-1 text-[15px] leading-[1.3] font-semibold">{"This link can't be opened"}</h1>
        <p className="text-[12.5px] leading-[1.45] text-pretty text-ink-2">
          {invalid
            ? "The design in this link is damaged or from an incompatible version, so nothing was saved. Ask for a new link or an exported JSON."
            : 'It may have been cut off when pasted — share links are long. Ask for it again or an exported JSON.'}
        </p>
        <Button variant="secondary" asChild className="mt-1.5">
          <Link href={DASHBOARD_PATH}>Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  const decoded = result;
  const components = countComponents(decoded.nodes);
  const size = formatBytes(new TextEncoder().encode(data).length);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    const project = createProjectWithContent(
      `Shared design (${new Date().toLocaleDateString()})`,
      '',
      decoded.nodes,
      decoded.edges
    );
    router.replace(canvasPath(project.id));
  };

  return (
    <div className="animate-dialog-in w-full max-w-[360px] overflow-hidden rounded-[16px] border border-line bg-paper shadow-[var(--shadow-lg)]">
      <div className="h-[130px] border-b border-line bg-line-2 p-3">
        <MinimapThumb
          nodes={decoded.nodes}
          edges={decoded.edges}
          empty={<div className="flex h-full items-center justify-center text-[12px] text-ink-3">Empty canvas</div>}
        />
      </div>
      <div className="grid gap-3 px-4 pt-3.5 pb-4">
        <div>
          <h1 className="text-[14px] leading-5 font-semibold">Shared design</h1>
          <div className="font-mono text-[12px] text-ink-3">
            {plural(components, 'component')} · {plural(decoded.edges.length, 'connection')} · {size}
          </div>
        </div>
        <p className="text-[12.5px] leading-[1.45] text-ink-2">
          {"This will be saved as a new project on this device. The original isn't affected."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="primary" onClick={handleOpen} disabled={opening}>
            <FolderInput />
            Open in my projects
          </Button>
          <Button variant="secondary" asChild>
            <Link href={DASHBOARD_PATH}>Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SharedCanvasPage() {
  return (
    <div className="dot-grid flex min-h-screen items-center justify-center p-6">
      <SharedCanvasInner />
    </div>
  );
}
