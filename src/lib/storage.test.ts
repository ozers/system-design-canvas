import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BACKUP_KEY,
  QUARANTINE_KEY,
  clearAppData,
  loadAppData,
  loadQuarantine,
  saveAppData,
} from './storage';
import type { AppData, Project } from '@/types';

const KEY = 'system-design-canvas';

/** Minimal in-memory localStorage; `quotaFor` makes setItem throw for one key. */
function memoryStorage(quotaFor?: string) {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (k === quotaFor) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  };
}

let storage: ReturnType<typeof memoryStorage>;

function useStorage(s: ReturnType<typeof memoryStorage>) {
  storage = s;
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', s);
}

function project(id: string, extra: Partial<Project> = {}): Project {
  return {
    id,
    name: `Project ${id}`,
    description: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    ...extra,
  };
}

function store(value: unknown) {
  storage.map.set(KEY, typeof value === 'string' ? value : JSON.stringify(value));
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  useStorage(memoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadAppData', () => {
  it('returns empty data when nothing is stored', () => {
    expect(loadAppData()).toEqual({ version: 1, projects: [], lastOpenedProjectId: null });
    expect(storage.map.has(BACKUP_KEY)).toBe(false);
  });

  it('reads valid data in the existing format without touching backup or quarantine', () => {
    const data: AppData = { version: 1, projects: [project('a'), project('b')], lastOpenedProjectId: 'b' };
    store(data);
    expect(loadAppData()).toEqual(data);
    expect(storage.map.has(BACKUP_KEY)).toBe(false);
    expect(storage.map.has(QUARANTINE_KEY)).toBe(false);
  });

  it('keeps good projects and quarantines a bad one, with a raw backup', () => {
    const bad = { id: 'bad', name: 42 };
    store({ version: 1, projects: [project('a'), bad, project('c')], lastOpenedProjectId: 'a' });
    const raw = storage.map.get(KEY);

    const data = loadAppData();

    expect(data.projects.map((p) => p.id)).toEqual(['a', 'c']);
    expect(data.lastOpenedProjectId).toBe('a');
    expect(storage.map.get(BACKUP_KEY)).toBe(raw);
    const q = loadQuarantine();
    expect(q).toHaveLength(1);
    expect(q[0].raw).toEqual(bad);
    expect(q[0].error).toBeTruthy();
  });

  it('does not quarantine the same project twice on repeated loads', () => {
    store({ version: 1, projects: [{ id: 'bad' }], lastOpenedProjectId: null });
    loadAppData();
    loadAppData();
    expect(loadQuarantine()).toHaveLength(1);
  });

  it('backs up unparseable JSON and returns an empty list', () => {
    store('{"version":1,"projects":[');
    const data = loadAppData();
    expect(data.projects).toEqual([]);
    expect(storage.map.get(BACKUP_KEY)).toBe('{"version":1,"projects":[');
  });

  it('backs up a value whose projects field is not a list', () => {
    store({ version: 1, projects: 'oops' });
    expect(loadAppData().projects).toEqual([]);
    expect(storage.map.has(BACKUP_KEY)).toBe(true);
  });

  it('keeps projects when only the top-level fields are invalid', () => {
    store({ version: 'x', projects: [project('a')], lastOpenedProjectId: 5 });
    const data = loadAppData();
    expect(data.projects.map((p) => p.id)).toEqual(['a']);
    expect(data.lastOpenedProjectId).toBeNull();
    expect(storage.map.has(BACKUP_KEY)).toBe(true);
  });
});

describe('saveAppData after a failed load', () => {
  it('does not overwrite unreadable stored data with an empty list', () => {
    store('not json');
    const data = loadAppData();
    expect(saveAppData(data)).toBe(true);
    expect(storage.map.get(KEY)).toBe('not json');
  });

  it('writes once there is real content, with the old value kept in the backup', () => {
    store('not json');
    const data = loadAppData();
    expect(saveAppData({ ...data, projects: [project('new')] })).toBe(true);
    expect(JSON.parse(storage.map.get(KEY)!).projects[0].id).toBe('new');
    expect(storage.map.get(BACKUP_KEY)).toBe('not json');
  });

  it('refuses to overwrite when the backup could not be written', () => {
    useStorage(memoryStorage(BACKUP_KEY));
    store('not json');
    const data = loadAppData();
    expect(saveAppData({ ...data, projects: [project('new')] })).toBe(false);
    expect(storage.map.get(KEY)).toBe('not json');
  });

  it('refuses to overwrite when invalid projects could not be quarantined', () => {
    useStorage(memoryStorage(QUARANTINE_KEY));
    store({ version: 1, projects: [project('a'), { id: 'bad' }], lastOpenedProjectId: null });
    const raw = storage.map.get(KEY);
    const data = loadAppData();
    expect(saveAppData(data)).toBe(false);
    expect(storage.map.get(KEY)).toBe(raw);
  });

  it('saves an empty list normally after a successful load', () => {
    store({ version: 1, projects: [project('a')], lastOpenedProjectId: null });
    const data = loadAppData();
    expect(saveAppData({ ...data, projects: [] })).toBe(true);
    expect(JSON.parse(storage.map.get(KEY)!).projects).toEqual([]);
  });

  it('clearAppData removes the main key but keeps backup and quarantine', () => {
    store({ version: 1, projects: [{ id: 'bad' }], lastOpenedProjectId: null });
    loadAppData();
    clearAppData();
    expect(storage.map.has(KEY)).toBe(false);
    expect(storage.map.has(BACKUP_KEY)).toBe(true);
    expect(storage.map.has(QUARANTINE_KEY)).toBe(true);
  });
});
