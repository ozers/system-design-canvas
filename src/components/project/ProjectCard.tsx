'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Copy, Download, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MinimapThumb } from '@/components/shared/MinimapThumb';
import { formatRelative, plural } from '@/lib/utils';
import type { Project } from '@/types';
import { countComponents } from './project-io';

import { canvasPath } from '@/lib/routes';
interface ProjectCardProps {
  project: Project;
  onRename: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onExport: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function ProjectCardComponent({ project, onRename, onDuplicate, onExport, onDelete }: ProjectCardProps) {
  const components = countComponents(project.nodes);
  const connections = project.edges.length;

  return (
    <div className="group relative flex flex-col rounded-[14px] border border-line bg-paper transition-[border-color,box-shadow] duration-[120ms] hover:border-ink-3 hover:shadow-[var(--shadow-lg)] has-[a:focus-visible]:border-accent has-[a:focus-visible]:shadow-[0_0_0_3px_var(--accent-soft)]">
      <div className="dot-grid flex h-[148px] items-center justify-center overflow-hidden rounded-t-[13px] border-b border-line-2 [background-size:16px_16px]">
        <div className="h-[76%] w-[72%] transition-transform duration-200 group-hover:scale-[1.03]">
          <MinimapThumb
            nodes={project.nodes}
            edges={project.edges}
            opacity={0.8}
            empty={<div className="flex h-full items-center justify-center text-[12px] text-ink-3">Empty canvas</div>}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 pt-3.5 pb-4">
        <div className="min-w-0 flex-1">
          {/* The title link stretches over the whole card; the menu button sits above it. */}
          <Link
            href={canvasPath(project.id)}
            className="block truncate text-[14.5px] leading-5 font-semibold text-ink outline-none after:absolute after:inset-0 after:rounded-[14px] after:content-['']"
          >
            {project.name}
          </Link>
          <div className="mt-1 truncate text-[12.5px] text-ink-3">
            <span className="font-mono text-[11.5px]">
              {plural(components, 'component')} · {plural(connections, 'connection')}
            </span>
          </div>
          <div className="mt-0.5 text-[12px] text-ink-3" title={new Date(project.updatedAt).toLocaleString()}>
            Edited {formatRelative(project.updatedAt)}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="icon"
              size="icon-sm"
              aria-label={`Actions for ${project.name}`}
              className="relative z-10 -mt-0.5 -mr-1.5 shrink-0 text-ink-3 data-[state=open]:bg-line-2 data-[state=open]:text-ink"
            >
              <Ellipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onRename(project)}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(project)}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExport(project)}>
              <Download />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(project)}
              className="text-danger focus:bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] [&_svg]:!text-danger"
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/** Re-renders (and redraws the thumbnail) only when the project was saved or handlers changed. */
export const ProjectCard = memo(
  ProjectCardComponent,
  (prev, next) =>
    prev.project.id === next.project.id &&
    prev.project.updatedAt === next.project.updatedAt &&
    prev.project.name === next.project.name &&
    prev.onRename === next.onRename &&
    prev.onDuplicate === next.onDuplicate &&
    prev.onExport === next.onExport &&
    prev.onDelete === next.onDelete
);
