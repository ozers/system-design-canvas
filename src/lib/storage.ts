import { AppDataSchema, ProjectSchema, type AppData, type Project } from '@/types';

const STORAGE_KEY = 'system-design-canvas';
/** Raw stored value as it was before a load had to drop or reset anything. */
export const BACKUP_KEY = 'system-design-canvas.backup';
/** Projects that failed validation, kept verbatim so they can be recovered by hand. */
export const QUARANTINE_KEY = 'system-design-canvas.quarantine';
const CURRENT_VERSION = 1;

export interface QuarantinedProject {
  quarantinedAt: string;
  error: string;
  raw: unknown;
}

/**
 * Set when the stored value could not be read at all and was replaced by an empty list in memory.
 * While set, an empty project list is never written over the stored value.
 */
let unreadableStorage = false;
/** Set when a damaged value could not be backed up; stored data is then never overwritten. */
let backupFailed = false;

function emptyData(): AppData {
  return { version: CURRENT_VERSION, projects: [], lastOpenedProjectId: null };
}

/** Keep the raw stored value under BACKUP_KEY. Returns false when the write failed. */
function backupRaw(raw: string): boolean {
  try {
    if (localStorage.getItem(BACKUP_KEY) !== raw) localStorage.setItem(BACKUP_KEY, raw);
    return true;
  } catch (e) {
    console.error('Failed to back up stored data:', e);
    return false;
  }
}

/** Read the quarantine list; unreadable content yields an empty list. */
export function loadQuarantine(): QuarantinedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(QUARANTINE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Append invalid projects to the quarantine list, skipping ones already there. */
function quarantine(items: { raw: unknown; error: string }[]): boolean {
  try {
    const existing = loadQuarantine();
    const seen = new Set(existing.map((q) => JSON.stringify(q.raw)));
    const now = new Date().toISOString();
    for (const item of items) {
      const key = JSON.stringify(item.raw);
      if (seen.has(key)) continue;
      seen.add(key);
      existing.push({ quarantinedAt: now, error: item.error, raw: item.raw });
    }
    localStorage.setItem(QUARANTINE_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.error('Failed to quarantine invalid projects:', e);
    return false;
  }
}

/**
 * Load app data. Each project is validated on its own: an invalid project is moved to
 * QUARANTINE_KEY instead of discarding everything. Whenever anything is dropped or reset,
 * the raw stored value is first copied to BACKUP_KEY.
 */
export function loadAppData(): AppData {
  unreadableStorage = false;
  backupFailed = false;
  if (typeof window === 'undefined') return emptyData();

  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    console.warn('localStorage is not available');
    return emptyData();
  }
  if (!raw) return emptyData();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }

  const container = parsed as { projects?: unknown } | null | undefined;
  if (
    !container ||
    typeof container !== 'object' ||
    Array.isArray(container) ||
    (container.projects !== undefined && !Array.isArray(container.projects))
  ) {
    console.warn(`Stored data is unreadable; kept a copy under "${BACKUP_KEY}"`);
    backupFailed = !backupRaw(raw);
    unreadableStorage = true;
    return emptyData();
  }

  const projects: Project[] = [];
  const invalid: { raw: unknown; error: string }[] = [];
  for (const item of (container.projects as unknown[] | undefined) ?? []) {
    const result = ProjectSchema.safeParse(item);
    if (result.success) projects.push(result.data);
    else invalid.push({ raw: item, error: result.error.message });
  }

  const meta = AppDataSchema.omit({ projects: true }).safeParse(container);
  if (invalid.length > 0 || !meta.success) {
    console.warn(
      `${invalid.length} stored project(s) failed validation; moved to "${QUARANTINE_KEY}", backup in "${BACKUP_KEY}"`
    );
    const backedUp = backupRaw(raw);
    const quarantined = invalid.length === 0 || quarantine(invalid);
    backupFailed = !backedUp || !quarantined;
  }

  const { version, lastOpenedProjectId } = meta.success
    ? meta.data
    : { version: CURRENT_VERSION, lastOpenedProjectId: null };
  return migrate({ version, projects, lastOpenedProjectId });
}

/** Persist app data. Returns false when the write failed (quota, private mode) or was unsafe. */
export function saveAppData(data: AppData): boolean {
  if (typeof window === 'undefined') return false;
  if (backupFailed) {
    console.error('Not saving: damaged stored data could not be backed up first');
    return false;
  }
  // Nothing to keep yet, and the stored value is still the only copy of what could not be read.
  if (unreadableStorage && data.projects.length === 0) return true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    unreadableStorage = false;
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

/** Remove all projects from this browser. Backup and quarantine keys are kept. */
export function clearAppData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  unreadableStorage = false;
  backupFailed = false;
}

function migrate(data: AppData): AppData {
  // Future migrations go here
  // if (data.version < 2) { ... data.version = 2; }
  return { ...data, version: CURRENT_VERSION };
}
