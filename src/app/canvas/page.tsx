'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Canvas } from '@/components/canvas/Canvas';
import { Button } from '@/components/ui/button';
import { DASHBOARD_PATH } from '@/lib/routes';
import { useProjectStore } from '@/stores/useProjectStore';

function CanvasMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="dot-grid flex min-h-screen items-center justify-center p-6">
      <div className="grid max-w-[300px] justify-items-center gap-2 text-center">
        <h1 className="text-[15px] font-semibold">{title}</h1>
        <p className="text-[12.5px] text-ink-2">{body}</p>
        <Button variant="secondary" asChild className="mt-1.5">
          <Link href={DASHBOARD_PATH}>Go to projects</Link>
        </Button>
      </div>
    </div>
  );
}

function CanvasRoute() {
  const id = useSearchParams().get('id');
  const loaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const exists = useProjectStore((s) => (id ? s.projects.some((p) => p.id === id) : false));

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  if (!id) {
    return <CanvasMessage title="No project selected" body="Open a project from your projects list." />;
  }
  // Projects come from localStorage; wait one effect instead of flashing an empty canvas.
  if (!loaded) return null;
  if (!exists) {
    return (
      <CanvasMessage
        title="Project not found"
        body="This project isn't saved in this browser. It may have been deleted, or the link came from another device."
      />
    );
  }

  // Keyed so switching projects remounts the canvas with fresh state.
  return <Canvas key={id} projectId={id} />;
}

export default function CanvasPage() {
  return (
    <Suspense fallback={null}>
      <CanvasRoute />
    </Suspense>
  );
}
