import { create } from 'zustand';
import { loadAppData, saveAppData } from '@/lib/storage';
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
  saveProject: (project: Project) => void;
  setLastOpened: (id: string | null) => void;
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
    persist(get());
  },

  setLastOpened: (id) => {
    set({ lastOpenedProjectId: id });
    persist(get());
  },
}));

function persist(state: ProjectStore) {
  const data: AppData = {
    version: 1,
    projects: state.projects,
    lastOpenedProjectId: state.lastOpenedProjectId,
  };
  saveAppData(data);
}
