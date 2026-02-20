'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';

export function useAutoSave() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useCanvasStore((s) => s.viewport);
  const projectId = useCanvasStore((s) => s.projectId);

  const projects = useProjectStore((s) => s.projects);
  const saveProject = useProjectStore((s) => s.saveProject);

  // Debounced save on changes
  useEffect(() => {
    if (!projectId) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        saveProject({ ...project, nodes, edges, viewport });
      }
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [nodes, edges, viewport, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!projectId) return;
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        saveProject({ ...project, nodes, edges, viewport });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }); // intentionally no deps — always latest refs
}
