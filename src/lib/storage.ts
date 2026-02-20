import { AppDataSchema, type AppData } from '@/types';

const STORAGE_KEY = 'system-design-canvas';
const CURRENT_VERSION = 1;

export function loadAppData(): AppData {
  if (typeof window === 'undefined') {
    return { version: CURRENT_VERSION, projects: [], lastOpenedProjectId: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: CURRENT_VERSION, projects: [], lastOpenedProjectId: null };
    }
    const parsed = JSON.parse(raw);
    const result = AppDataSchema.safeParse(parsed);
    if (result.success) {
      return migrate(result.data);
    }
    console.warn('Invalid storage data, resetting');
    return { version: CURRENT_VERSION, projects: [], lastOpenedProjectId: null };
  } catch {
    console.warn('Failed to load storage, resetting');
    return { version: CURRENT_VERSION, projects: [], lastOpenedProjectId: null };
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function migrate(data: AppData): AppData {
  // Future migrations go here
  // if (data.version < 2) { ... data.version = 2; }
  return { ...data, version: CURRENT_VERSION };
}
