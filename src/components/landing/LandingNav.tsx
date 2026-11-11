'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Boxes, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubIcon } from '@/components/ui/github-icon';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import { DASHBOARD_PATH } from '@/lib/routes';
import { STORAGE_KEY } from '@/lib/storage';
import { GITHUB_URL } from './links';

/** Number of saved projects on this device, read without loading the project store. */
function useSavedProjectCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const projects = raw ? (JSON.parse(raw) as { projects?: unknown }).projects : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
      if (Array.isArray(projects)) setCount(projects.length);
    } catch {
      // Unreadable storage: show the plain link.
    }
  }, []);
  return count;
}

export function LandingNav() {
  const { theme, toggleTheme } = useTheme();
  const count = useSavedProjectCount();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1128px] items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="focus-ring -ml-1 flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 text-[14px] font-semibold whitespace-nowrap text-ink"
        >
          <span className="inline-flex size-[26px] items-center justify-center rounded-[8px] bg-ink text-paper">
            <Boxes className="size-[15px]" />
          </span>
          <span className="hidden sm:inline">System Design Canvas</span>
        </Link>

        <nav className="-mr-1.5 ml-auto flex items-center gap-1" aria-label="Main">
          <Button variant="ghost" asChild>
            <Link href={DASHBOARD_PATH}>
              Projects
              {count > 0 && (
                <span className="rounded-full bg-line-2 px-1.5 font-mono text-[11px] leading-4 text-ink-2">{count}</span>
              )}
            </Link>
          </Button>
          <SimpleTooltip label="Source on GitHub">
            <Button variant="icon" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="Source on GitHub">
                <GithubIcon className="size-4" />
              </a>
            </Button>
          </SimpleTooltip>
          <SimpleTooltip label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
            <Button variant="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </SimpleTooltip>
        </nav>
      </div>
    </header>
  );
}
