'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/useProjectStore';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { TemplateSelector } from './TemplateSelector';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Server, Database, Layers, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Project } from '@/types';

export function ProjectList() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const loaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const createProject = useProjectStore((s) => s.createProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const importProject = useProjectStore((s) => s.importProject);
  const exportProject = useProjectStore((s) => s.exportProject);
  const renameProject = useProjectStore((s) => s.renameProject);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  const handleCreate = (name: string, description: string) => {
    const project = createProject(name, description);
    router.push(`/canvas/${project.id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  const handleExport = (id: string) => {
    const json = exportProject(id);
    if (!json) return;
    const project = projects.find((p) => p.id === id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${project?.name || 'project'}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const project = importProject(json);
        if (project) {
          router.push(`/canvas/${project.id}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleRename = (name: string) => {
    if (renameTarget) {
      renameProject(renameTarget.id, name);
      setRenameTarget(null);
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <TemplateSelector />
      </div>

      {projects.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex items-center justify-center gap-3 text-muted-foreground/50">
            <Server className="h-10 w-10" />
            <ArrowRight className="h-6 w-6" />
            <Database className="h-10 w-10" />
            <ArrowRight className="h-6 w-6" />
            <Layers className="h-10 w-10" />
          </div>
          <p className="text-lg font-medium text-foreground">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first system design canvas
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRename={setRenameTarget}
              onDuplicate={duplicateProject}
              onExport={handleExport}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Create New Project"
      />

      <ProjectModal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRename}
        title="Rename Project"
        defaultName={renameTarget?.name}
      />
    </div>
  );
}
