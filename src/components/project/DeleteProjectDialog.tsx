'use client';

import { Button } from '@/components/ui/button';
import { plural } from '@/lib/utils';
import type { Project } from '@/types';
import { ConfirmDialog } from './ConfirmDialog';
import { countComponents } from './project-io';

interface DeleteProjectDialogProps {
  project: Project | null;
  onClose: () => void;
  onConfirm: (project: Project) => void;
  onExport: (project: Project) => void;
}

export function DeleteProjectDialog({ project, onClose, onConfirm, onExport }: DeleteProjectDialogProps) {
  const components = project ? countComponents(project.nodes) : 0;
  const connections = project ? project.edges.length : 0;

  return (
    <ConfirmDialog
      open={!!project}
      onClose={onClose}
      title={`Delete “${project?.name ?? ''}”?`}
      description={`${plural(components, 'component')} and ${plural(connections, 'connection')} will be removed. You can export it first.`}
      actions={
        project && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => onExport(project)}>
              Export
            </Button>
            <Button variant="danger-solid" onClick={() => onConfirm(project)}>
              Delete
            </Button>
          </>
        )
      }
    />
  );
}
