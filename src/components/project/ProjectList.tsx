'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, Check, ChevronDown, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, plural } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from '@/stores/useToastStore';
import type { Project } from '@/types';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { TemplateStrip } from './TemplateStrip';
import { createFromTemplate, exportProjectFile } from './project-io';

import { canvasPath } from '@/lib/routes';
type SortKey = 'edited' | 'name' | 'created';

const SORT_LABEL: Record<SortKey, string> = {
  edited: 'Last edited',
  name: 'Name',
  created: 'Created',
};

type ModalState = { mode: 'create'; name: string } | { mode: 'rename'; project: Project } | null;

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/** Latest stored copy of a project (cards may hold a slightly older object). */
function latest(project: Project) {
  return useProjectStore.getState().projects.find((p) => p.id === project.id) ?? project;
}

export function ProjectList() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const loaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const createProject = useProjectStore((s) => s.createProject);
  const renameProject = useProjectStore((s) => s.renameProject);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('edited');
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  // `/` focuses search unless the user is typing somewhere or a dialog is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const q = query.trim();
  const visible = useMemo(() => {
    const needle = q.toLowerCase();
    const list = needle ? projects.filter((p) => p.name.toLowerCase().includes(needle)) : projects;
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'created') return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [projects, q, sort]);

  const openCreate = useCallback((name = '') => setModal({ mode: 'create', name }), []);
  const handleRename = useCallback((project: Project) => setModal({ mode: 'rename', project }), []);
  const handleDelete = useCallback((project: Project) => setDeleteTarget(latest(project)), []);

  const handleDuplicate = useCallback((project: Project) => {
    const copy = useProjectStore.getState().duplicateProject(project.id);
    if (copy) toast({ message: `Duplicated “${project.name}”`, tone: 'ok' });
  }, []);

  const handleExport = useCallback((project: Project) => {
    const filename = exportProjectFile(latest(project));
    toast({ message: `Exported ${filename}`, tone: 'ok' });
  }, []);

  const handleUseTemplate = useCallback(
    (templateId: string) => {
      const project = createFromTemplate(templateId);
      if (project) router.push(canvasPath(project.id));
    },
    [router]
  );

  const handleModalSubmit = (name: string, description: string) => {
    if (modal?.mode === 'rename') {
      renameProject(modal.project.id, name);
      setModal(null);
      return;
    }
    const project = createProject(name, description);
    setModal(null);
    router.push(canvasPath(project.id));
  };

  const confirmDelete = (project: Project) => {
    useProjectStore.getState().deleteProject(project.id);
    setDeleteTarget(null);
    toast({
      message: `Deleted “${project.name}”`,
      icon: Trash2,
      duration: 5000,
      action: { label: 'Undo', onClick: () => useProjectStore.getState().restoreProject(project) },
    });
  };

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-ink">Projects</h1>
          <p className="mt-1 min-h-[21px] text-[14px] text-ink-2">
            {loaded && `${plural(projects.length, 'project')} · saved in this browser`}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => openCreate()}>
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      <div className="mb-11">
        <TemplateStrip onSelect={handleUseTemplate} defaultExpanded={loaded && projects.length === 0} />
      </div>

      {loaded &&
        (projects.length === 0 ? (
          <EmptyState onCreate={() => openCreate()} />
        ) : (
          <section aria-labelledby="recent-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-1">
                <h2 id="recent-heading" className="text-[13px] font-medium text-ink-2">
                  Recent
                </h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 gap-1.5 px-2.5 text-[12.5px] font-normal">
                      <ArrowUpDown className="size-[13px]" />
                      {SORT_LABEL[sort]}
                      <ChevronDown className="size-[13px] text-ink-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[160px]">
                    {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                      <DropdownMenuItem key={key} onSelect={() => setSort(key)}>
                        {SORT_LABEL[key]}
                        <Check className={cn('ml-auto text-accent', key !== sort && 'invisible')} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <SearchInput
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQuery('');
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Search projects…"
                aria-label="Search projects"
                className="h-8"
                containerClassName="w-full sm:w-[260px]"
              />
            </div>

            {visible.length === 0 ? (
              <NoResults query={q} onCreate={() => openCreate(q)} />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {visible.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onRename={handleRename}
                    onDuplicate={handleDuplicate}
                    onExport={handleExport}
                    onDelete={handleDelete}
                  />
                ))}
                {!q && <NewProjectCard onCreate={() => openCreate()} />}
              </div>
            )}
          </section>
        ))}

      <ProjectModal
        open={!!modal}
        onClose={() => setModal(null)}
        mode={modal?.mode ?? 'create'}
        defaultName={modal?.mode === 'rename' ? modal.project.name : modal?.name}
        onSubmit={handleModalSubmit}
        onUseTemplate={handleUseTemplate}
      />

      <DeleteProjectDialog
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        onExport={handleExport}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-line p-6 text-center">
      <div className="relative h-[72px] w-[120px]" aria-hidden>
        <div className="absolute top-[18px] left-0 h-9 w-16 rounded-[8px] border border-line bg-paper shadow-[var(--shadow)]" />
        <div className="absolute top-0 right-0 h-9 w-16 rounded-[8px] border border-line bg-paper shadow-[var(--shadow)]" />
        <div className="absolute right-3 bottom-0 h-9 w-16 rounded-[8px] border border-dashed border-ink-3" />
      </div>
      <div className="grid gap-1">
        <div className="text-[15px] font-semibold">No projects yet</div>
        <div className="text-[13px] text-pretty text-ink-2">
          Start from a template above, or draw your first system from scratch.
        </div>
      </div>
      <Button variant="primary" size="md" onClick={onCreate}>
        <Plus className="size-4" />
        New project
      </Button>
    </div>
  );
}

function NewProjectCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="focus-ring group flex min-h-[232px] flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-line text-center transition-[border-color,background-color] duration-[120ms] hover:border-ink-3 hover:bg-paper"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-line-2 text-ink-2 transition-colors duration-[120ms] group-hover:bg-accent-soft group-hover:text-accent">
        <Plus className="size-[18px]" />
      </span>
      <span className="grid gap-0.5">
        <span className="text-[13.5px] font-medium text-ink">New project</span>
        <span className="text-[12.5px] text-ink-3">Blank canvas or a template</span>
      </span>
    </button>
  );
}

function NoResults({ query, onCreate }: { query: string; onCreate: () => void }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-line p-6 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-line-2 text-ink-3">
        <Search className="size-[18px]" />
      </span>
      <div className="grid gap-1">
        <div className="text-[15px] font-semibold break-words">Nothing for “{query}”</div>
        <div className="text-[13px] text-pretty text-ink-2">Try another name, or create a project with it.</div>
      </div>
      <Button variant="secondary" onClick={onCreate} className="max-w-full">
        <span className="truncate">Create “{query}”</span>
      </Button>
    </div>
  );
}
