'use client';

import Link from 'next/link';
import { Boxes, ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { KeyboardShortcuts } from '@/components/canvas/KeyboardShortcuts';

interface HeaderProps {
  projectName?: string;
  showBack?: boolean;
}

export function Header({ projectName, showBack }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 items-center gap-3 px-4 md:px-6">
        {showBack && (
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Boxes className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">System Design Canvas</span>
        </Link>
        {projectName && (
          <>
            <span className="text-border">/</span>
            <span className="text-sm text-muted-foreground truncate">{projectName}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {showBack && <KeyboardShortcuts />}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
