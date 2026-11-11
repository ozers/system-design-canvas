import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { GithubIcon } from '@/components/ui/github-icon';
import { DASHBOARD_PATH } from '@/lib/routes';
import { GITHUB_URL } from './links';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1128px] flex-col gap-4 px-4 py-8 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-[6px] bg-line-2 text-ink-2">
            <Boxes className="size-3" />
          </span>
          <span>System Design Canvas · MIT licensed</span>
        </div>
        <nav className="flex items-center gap-4 sm:ml-auto" aria-label="Footer">
          <Link href={DASHBOARD_PATH} className="hover:text-ink">
            Projects
          </Link>
          <Link href="/settings" className="hover:text-ink">
            Settings
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
            <GithubIcon className="size-3.5" />
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
