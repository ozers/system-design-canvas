'use client';

import Link from 'next/link';
import { Boxes, ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  projectName?: string;
  showBack?: boolean;
}

export function Header({ projectName, showBack }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-6">
        {showBack && (
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2 font-semibold dark:text-white">
          <Boxes className="h-5 w-5 text-blue-600" />
          System Design Canvas
        </Link>
        {projectName && (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{projectName}</span>
          </>
        )}
        <div className="ml-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
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
