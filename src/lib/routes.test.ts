import { afterEach, describe, expect, it, vi } from 'vitest';
import { LANDING_PATH, shouldOpenDashboard } from './routes';
import { countStoredProjects } from './storage';

const KEY = 'system-design-canvas';

function useStorage(value: string | null, opts: { throws?: boolean } = {}) {
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => {
      if (opts.throws) throw new Error('SecurityError');
      return k === KEY ? value : null;
    },
    setItem: () => {
      throw new Error('landing must not write');
    },
    removeItem: () => {
      throw new Error('landing must not write');
    },
  });
}

const project = {
  id: 'p1',
  name: 'Project p1',
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

/** The landing's decision: what `/` does for the current storage and query string. */
function decide(search = '') {
  return shouldOpenDashboard(search, countStoredProjects());
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('landing redirect for returning visitors', () => {
  it('opens the dashboard when a saved project exists', () => {
    useStorage(JSON.stringify({ version: 1, projects: [project], lastOpenedProjectId: null }));
    expect(decide()).toBe(true);
    expect(decide('?utm_source=x')).toBe(true);
  });

  it('stays on the landing with no stored data', () => {
    useStorage(null);
    expect(decide()).toBe(false);
  });

  it('stays on the landing with an empty project list', () => {
    useStorage(JSON.stringify({ version: 1, projects: [], lastOpenedProjectId: null }));
    expect(decide()).toBe(false);
  });

  it.each([
    ['invalid JSON', '{not json'],
    ['null', 'null'],
    ['projects not an array', JSON.stringify({ projects: 'x' })],
    ['only invalid projects', JSON.stringify({ projects: [{ id: 1 }, null] })],
  ])('stays on the landing with corrupt storage (%s)', (_, raw) => {
    useStorage(raw);
    expect(() => decide()).not.toThrow();
    expect(decide()).toBe(false);
  });

  it('stays on the landing when localStorage throws', () => {
    useStorage(null, { throws: true });
    expect(decide()).toBe(false);
  });

  it('stays on the landing during prerender (no window)', () => {
    expect(countStoredProjects()).toBe(0);
  });

  it('keeps the landing with the ?home opt-out', () => {
    useStorage(JSON.stringify({ version: 1, projects: [project], lastOpenedProjectId: null }));
    expect(decide('?home')).toBe(false);
    expect(decide('?home=1&x=y')).toBe(false);
    expect(decide(LANDING_PATH.slice(1))).toBe(false);
  });
});
