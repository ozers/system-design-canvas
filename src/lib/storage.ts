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

/** Persist app data. Returns false when the write failed (quota, private mode). */
export function saveAppData(data: AppData): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
}

/** Approximate size of the stored app data in bytes. */
export function getStorageSize(): number {
  if (typeof window === 'undefined') return 0;
  return new Blob([localStorage.getItem(STORAGE_KEY) ?? '']).size;
}

/** Remove all projects from this browser. */
export function clearAppData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

function migrate(data: AppData): AppData {
  // Future migrations go here
  // if (data.version < 2) { ... data.version = 2; }
  return { ...data, version: CURRENT_VERSION };
}
