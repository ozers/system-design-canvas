import LZString from 'lz-string';
import { ProjectSchema, type Project } from '@/types';

/**
 * Moving between hosts. Projects live in localStorage, which is scoped to the origin,
 * so a new domain starts empty. The old site packs everything into the URL hash of
 * `<target>/import#…` (the hash never reaches a server) and the new site imports it.
 */

/** Origin users are being moved to, e.g. "https://sdc.example.com". Unset = no banner. */
export const MIGRATE_TO = process.env.NEXT_PUBLIC_MIGRATE_TO?.replace(/\/+$/, '') || null;

/** Chrome caps URLs at ~2 MB; stay under it and fall back to a JSON backup above. */
export const MAX_MIGRATION_URL_LENGTH = 1_900_000;

const SETTINGS_KEY = 'sdc.settings';
const ONBOARDED_KEY = 'sdc.onboarded';

export interface MigrationPayload {
  v: 1;
  projects: Project[];
  /** Raw persisted settings blob (`sdc.settings`), if any. */
  settings: unknown;
  onboarded: boolean;
}

/** True when this deployment should invite users to move to MIGRATE_TO. */
export function shouldOfferMigration() {
  return !!MIGRATE_TO && typeof window !== 'undefined' && window.location.origin !== MIGRATE_TO;
}

export function buildMigrationUrl(target: string, projects: Project[]): string {
  let settings: unknown = null;
  try {
    settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
  } catch {
    settings = null;
  }
  const payload: MigrationPayload = {
    v: 1,
    projects,
    settings,
    onboarded: localStorage.getItem(ONBOARDED_KEY) !== null,
  };
  return `${target}/import#${LZString.compressToEncodedURIComponent(JSON.stringify(payload))}`;
}

/** Decode `location.hash` from the import page. Null when missing or corrupt. */
export function decodeMigrationHash(hash: string): MigrationPayload | null {
  const encoded = hash.replace(/^#/, '');
  if (!encoded) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data = JSON.parse(json);
    if (data?.v !== 1 || !Array.isArray(data.projects)) return null;
    const projects = data.projects.flatMap((item: unknown) => {
      const parsed = ProjectSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
    return { v: 1, projects, settings: data.settings ?? null, onboarded: !!data.onboarded };
  } catch {
    return null;
  }
}

/** Carry settings and the onboarding flag over, without overwriting anything set here. */
export function applyMigratedPreferences(payload: MigrationPayload): boolean {
  let appliedSettings = false;
  if (payload.settings && localStorage.getItem(SETTINGS_KEY) === null) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload.settings));
    appliedSettings = true;
  }
  if (payload.onboarded && localStorage.getItem(ONBOARDED_KEY) === null) {
    localStorage.setItem(ONBOARDED_KEY, '1');
  }
  return appliedSettings;
}
