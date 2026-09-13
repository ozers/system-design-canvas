'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';

const DEBOUNCE_MS = 500;
const RETRY_MS = 3000;

/** Write the active canvas into its project. Returns false when localStorage refused the write. */
function persistCanvas(): boolean {
  const { nodes, edges, viewport, projectId } = useCanvasStore.getState();
  if (!projectId) return true;
  const projectStore = useProjectStore.getState();
  const project = projectStore.projects.find((p) => p.id === projectId);
  if (!project) return true;
  return projectStore.saveProject({ ...project, nodes, edges, viewport });
}

/** Debounced save (500ms) + beforeunload. Drives saveStatus; retries every 3s after a failure. */
export function useAutoSave() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useCanvasStore((s) => s.viewport);
  const projectId = useCanvasStore((s) => s.projectId);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const { saveStatus, setSaveStatus } = useCanvasStore.getState();
    // While offline, keep showing the error until a retry succeeds.
    if (saveStatus !== 'error') setSaveStatus('saving');

    const attempt = () => {
      debounceRef.current = null;
      if (retryRef.current) clearTimeout(retryRef.current);
      retryRef.current = null;
      if (persistCanvas()) {
        useCanvasStore.getState().setSaveStatus('saved');
      } else {
        useCanvasStore.getState().setSaveStatus('error');
        retryRef.current = setTimeout(attempt, RETRY_MS);
      }
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(attempt, DEBOUNCE_MS);
  }, [nodes, edges, viewport, projectId]);

  // Flush a pending save when leaving the canvas; stop retrying.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        persistCanvas();
      }
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistCanvas();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
}
