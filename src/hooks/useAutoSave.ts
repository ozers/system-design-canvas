'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';

const DEBOUNCE_MS = 500;
const RETRY_MS = 3000;

/**
 * Write the active canvas into its project.
 * - `saved`: written to localStorage.
 * - `failed`: localStorage refused the write (quota, private mode); worth retrying.
 * - `missing`: there is no such project, so nothing was written. Never report this as saved.
 */
export function persistCanvas(): 'saved' | 'failed' | 'missing' {
  const { nodes, edges, viewport, projectId } = useCanvasStore.getState();
  if (!projectId) return 'missing';
  const projectStore = useProjectStore.getState();
  const project = projectStore.projects.find((p) => p.id === projectId);
  if (!project) return 'missing';
  return projectStore.saveProject({ ...project, nodes, edges, viewport }) ? 'saved' : 'failed';
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
      const result = persistCanvas();
      if (result === 'saved') {
        useCanvasStore.getState().setSaveStatus('saved');
      } else if (result === 'missing') {
        // Retrying can't help: the project isn't there.
        useCanvasStore.getState().setSaveStatus('unsaved');
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
