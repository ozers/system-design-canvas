import { create } from 'zustand';
import { clearAppData, loadAppData, saveAppData } from '@/lib/storage';
import type { Project, AppData } from '@/types';

interface ProjectStore {
  projects: Project[];
  lastOpenedProjectId: string | null;
  loaded: boolean;
  loadProjects: () => void;
  createProject: (name: string, description?: string) => Project;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => Project | null;
  importProject: (json: string) => Project | null;
  exportProject: (id: string) => string | null;
  /** Returns false when localStorage refused the write. */
  saveProject: (project: Project) => boolean;
  setLastOpened: (id: string | null) => void;
  /** Put a deleted project back (same id). No-op if it still exists. */
  restoreProject: (project: Project) => void;
  /** Add projects from an exported file. Each gets a fresh id; timestamps are kept when present. */
  importProjects: (items: Partial<Project>[]) => Project[];
  /** Remove every project from memory and from this browser. */
  clearAllProjects: () => void;
  /** Add projects moved from another origin, keeping ids and timestamps. Existing ids are skipped. */
  mergeProjects: (items: Project[]) => { added: number; skipped: number };
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  lastOpenedProjectId: null,
  loaded: false,

  loadProjects: () => {
    const data = loadAppData();
    set({ projects: data.projects, lastOpenedProjectId: data.lastOpenedProjectId, loaded: true });
  },

  createProject: (name, description) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    const projects = [...get().projects, project];
    set({ projects });
    persist(get());
    return project;
  },

  deleteProject: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    const lastOpenedProjectId =
      get().lastOpenedProjectId === id ? null : get().lastOpenedProjectId;
    set({ projects, lastOpenedProjectId });
    persist(get());
  },

  duplicateProject: (id) => {
    const original = get().projects.find((p) => p.id === id);
    if (!original) return null;
    const now = new Date().toISOString();
    const project: Project = {
      ...structuredClone(original),
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const projects = [...get().projects, project];
    set({ projects });
    persist(get());
    return project;
  },

  importProject: (json) => {
    try {
      const parsed = JSON.parse(json);
      const now = new Date().toISOString();
      const project: Project = {
        id: crypto.randomUUID(),
        name: parsed.name || 'Imported Project',
        description: parsed.description || '',
        createdAt: now,
        updatedAt: now,
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        viewport: parsed.viewport || { x: 0, y: 0, zoom: 1 },
      };
      const projects = [...get().projects, project];
      set({ projects });
      persist(get());
      return project;
    } catch {
      console.error('Failed to import project');
      return null;
    }
  },

  exportProject: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return null;
    return JSON.stringify(project, null, 2);
  },

  renameProject: (id, name) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
    );
    set({ projects });
    persist(get());
  },

  saveProject: (project) => {
    const projects = get().projects.map((p) =>
      p.id === project.id ? { ...project, updatedAt: new Date().toISOString() } : p
    );
    set({ projects });
    return persist(get());
  },

  setLastOpened: (id) => {
    set({ lastOpenedProjectId: id });
    persist(get());
  },

  restoreProject: (project) => {
    if (get().projects.some((p) => p.id === project.id)) return;
    set({ projects: [...get().projects, project] });
    persist(get());
  },

  mergeProjects: (items) => {
    const existing = new Set(get().projects.map((p) => p.id));
    const fresh = items.filter((p) => !existing.has(p.id));
    if (fresh.length > 0) {
      set({ projects: [...get().projects, ...fresh] });
      persist(get());
    }
    return { added: fresh.length, skipped: items.length - fresh.length };
  },

  importProjects: (items) => {
    const now = new Date().toISOString();
    const imported: Project[] = items.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name || 'Imported Project',
      description: item.description || '',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : now,
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : now,
      nodes: Array.isArray(item.nodes) ? item.nodes : [],
      edges: Array.isArray(item.edges) ? item.edges : [],
      viewport: item.viewport ?? { x: 0, y: 0, zoom: 1 },
    }));
    if (imported.length === 0) return imported;
    set({ projects: [...get().projects, ...imported] });
    persist(get());
    return imported;
  },

  clearAllProjects: () => {
    set({ projects: [], lastOpenedProjectId: null });
    clearAppData();
  },
}));

function persist(state: ProjectStore): boolean {
  const data: AppData = {
    version: 1,
    projects: state.projects,
    lastOpenedProjectId: state.lastOpenedProjectId,
  };
  return saveAppData(data);
}
