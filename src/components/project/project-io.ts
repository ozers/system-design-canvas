import { parseDockerCompose } from '@/lib/docker-compose';
import { TEMPLATES } from '@/lib/templates';
import { downloadFile } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from '@/stores/useToastStore';
import type { Project, SystemEdge, SystemNode } from '@/types';

/** Number of real components (excludes notes and groups). */
export function countComponents(nodes: { type?: string }[]) {
  return nodes.filter((n) => n.type === 'system').length;
}

/** Load stored projects first so a write never replaces them with an empty list. */
function ensureLoaded() {
  const store = useProjectStore.getState();
  if (!store.loaded) store.loadProjects();
}

/** Open the browser file picker. Resolves with the chosen file (never resolves on cancel). */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

function isProjectLike(value: unknown): value is Partial<Project> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Project>;
  return Array.isArray(v.nodes) && Array.isArray(v.edges);
}

/** Parse an exported file: one project, or `{ version, projects: [...] }`. Throws a readable error. */
export function parseProjectsFile(text: string): Partial<Project>[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Not valid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
  }
  if (data && typeof data === 'object' && Array.isArray((data as { projects?: unknown }).projects)) {
    const list = (data as { projects: unknown[] }).projects.filter(isProjectLike);
    if (list.length === 0) throw new Error('The file has no projects in it.');
    return list;
  }
  if (isProjectLike(data)) return [data];
  throw new Error('Not a System Design Canvas project: expected "nodes" and "edges".');
}

/** Danger toast with a Details action that reveals the underlying message. */
export function showReadError(fileName: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  toast({
    message: `Couldn't read ${fileName}`,
    tone: 'danger',
    action: { label: 'Details', onClick: () => toast({ message: detail, tone: 'danger', duration: 6000 }) },
  });
}

/**
 * Import a picked or dropped file (.json export or docker-compose .yml/.yaml).
 * Returns the created projects; on failure shows an error toast and returns [].
 */
export async function importFile(file: File): Promise<Project[]> {
  ensureLoaded();
  try {
    const text = await file.text();
    const { importProjects } = useProjectStore.getState();
    if (/\.ya?ml$/i.test(file.name)) {
      const { nodes, edges } = parseDockerCompose(text);
      const name = file.name.replace(/\.ya?ml$/i, '');
      return importProjects([{ name, description: `Imported from ${file.name}`, nodes, edges }]);
    }
    return importProjects(parseProjectsFile(text));
  } catch (e) {
    showReadError(file.name, e);
    return [];
  }
}

/** Create a project with the given content (createProject + saveProject). */
export function createProjectWithContent(
  name: string,
  description: string,
  nodes: SystemNode[],
  edges: SystemEdge[]
): Project {
  ensureLoaded();
  const { createProject, saveProject } = useProjectStore.getState();
  const project = createProject(name, description);
  saveProject({ ...project, nodes, edges });
  return project;
}

export function createFromTemplate(templateId: string): Project | null {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;
  return createProjectWithContent(
    template.name,
    template.description,
    structuredClone(template.nodes),
    structuredClone(template.edges)
  );
}

/** Download one project as JSON. Returns the file name. */
export function exportProjectFile(project: Project): string {
  const filename = `${project.name || 'project'}.json`;
  downloadFile(filename, new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
  return filename;
}

/** Download every project as `{ version: 1, projects }`. Returns the file name. */
export function exportAllProjectsFile(projects: Project[]): string {
  const filename = `system-design-canvas-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify({ version: 1, projects }, null, 2);
  downloadFile(filename, new Blob([json], { type: 'application/json' }));
  return filename;
}
