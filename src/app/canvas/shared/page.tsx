'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { decodeCanvasFromUrl } from '@/lib/share';
import { useProjectStore } from '@/stores/useProjectStore';
import { Suspense } from 'react';

function SharedCanvasInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const loaded = useProjectStore((s) => s.loaded);
  const processed = useRef(false);

  const data = searchParams.get('d');
  const decoded = data ? decodeCanvasFromUrl(data) : null;
  const isValid = !!decoded;

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  useEffect(() => {
    if (!loaded || processed.current || !decoded) return;
    processed.current = true;

    const project = createProject(`Shared Design (${new Date().toLocaleDateString()})`, '');
    const { saveProject } = useProjectStore.getState();
    saveProject({ ...project, nodes: decoded.nodes, edges: decoded.edges });
    router.replace(`/canvas/${project.id}`);
  }, [loaded, decoded, createProject, router]);

  if (!isValid) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">Invalid Share Link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The shared design link is invalid or corrupted.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading shared design...</p>
    </div>
  );
}

export default function SharedCanvasPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <SharedCanvasInner />
    </Suspense>
  );
}
