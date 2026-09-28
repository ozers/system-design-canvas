import { parseDockerCompose } from '@/lib/docker-compose';
import { parseJsonImport, titleFromFilename, type JsonImportItem } from '@/lib/json-import';
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

/** Parse an exported file, a project backup, or an API endpoint list. Throws a readable error. */
export function parseProjectsFile(text: string): JsonImportItem[] {
  return parseJsonImport(text);
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
 * Import a picked or dropped file: project JSON, an API endpoint list, or docker-compose.
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
    const items = parseProjectsFile(text).map((item) =>
      item.fromEndpoints ? { ...item, name: titleFromFilename(file.name) } : item
    );
    return importProjects(items);
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
