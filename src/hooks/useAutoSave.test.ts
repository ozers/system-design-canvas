import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistCanvas } from './useAutoSave';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Project } from '@/types';

const project: Project = {
  id: 'p1',
  name: 'P',
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

describe('persistCanvas', () => {
  beforeEach(() => {
    useProjectStore.setState({ projects: [project], loaded: true });
  });

  it('reports missing, not saved, when the canvas has no project', () => {
    useCanvasStore.setState({ projectId: null });
    expect(persistCanvas()).toBe('missing');
  });

  it('reports missing for an id that is not a saved project (QA #3)', () => {
    const save = vi.spyOn(useProjectStore.getState(), 'saveProject');
    useCanvasStore.getState().initCanvas('nope', [], [], { x: 0, y: 0, zoom: 1 });
    expect(persistCanvas()).toBe('missing');
    expect(save).not.toHaveBeenCalled();
  });

  it('saves into an existing project and reports a refused write', () => {
    const saveProject = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    useProjectStore.setState({ saveProject });
    useCanvasStore.getState().initCanvas('p1', [], [], { x: 1, y: 2, zoom: 1 });
    expect(persistCanvas()).toBe('saved');
    expect(saveProject).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', viewport: { x: 1, y: 2, zoom: 1 } }));
    expect(persistCanvas()).toBe('failed');
  });
});
