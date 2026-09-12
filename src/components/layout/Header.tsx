'use client';

import Link from 'next/link';
import { Boxes, Container, FileJson, Github, Moon, Settings2, Sun, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface HeaderProps {
  /** Dashboard only: passing either handler shows the Import menu. */
  onImportJson?: () => void;
  onImportDockerCompose?: () => void;
  /** Width of the inner row; match the page's content container so edges line up. */
  containerClassName?: string;
}

/** Sticky 56px app header for the dashboard and settings. The canvas has its own header. */
export function Header({ onImportJson, onImportDockerCompose, containerClassName }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const showImport = !!(onImportJson || onImportDockerCompose);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className={cn('mx-auto flex h-14 w-full max-w-[1128px] items-center gap-3 px-6', containerClassName)}>
        <Link
          href="/"
          className="focus-ring -ml-1 flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 text-[14px] font-semibold whitespace-nowrap text-ink"
        >
          <span className="inline-flex size-[26px] items-center justify-center rounded-[8px] bg-accent text-accent-ink">
            <Boxes className="size-[15px]" />
          </span>
          <span className="hidden sm:inline">System Design Canvas</span>
        </Link>

        <div className="-mr-1.5 ml-auto flex items-center gap-1">
          {showImport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Upload />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onImportJson && (
                  <DropdownMenuItem onSelect={onImportJson}>
                    <FileJson />
                    Project JSON
                  </DropdownMenuItem>
                )}
                {onImportDockerCompose && (
                  <DropdownMenuItem onSelect={onImportDockerCompose}>
                    <Container />
                    Docker Compose
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <SimpleTooltip label="Settings">
            <Button variant="icon" asChild>
              <Link href="/settings" aria-label="Settings">
                <Settings2 className="size-4" />
              </Link>
            </Button>
          </SimpleTooltip>

          <SimpleTooltip label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
            <Button variant="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </SimpleTooltip>

          <SimpleTooltip label="GitHub">
            <Button variant="icon" asChild>
              <a
                href="https://github.com/ozers/system-design-canvas"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <Github className="size-4" />
              </a>
            </Button>
          </SimpleTooltip>
        </div>
      </div>
    </header>
  );
}
