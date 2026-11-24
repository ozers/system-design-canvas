import { Button } from '@/components/ui/button';
import { GithubIcon } from '@/components/ui/github-icon';
import { GITHUB_URL } from './links';
import { OpenCanvasButton } from './OpenCanvasButton';

export function ClosingCta() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-[1128px] justify-items-center px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="max-w-[560px] text-[24px] leading-[1.25] font-semibold tracking-[-0.015em] text-balance text-ink sm:text-[28px]">
          Sketch the next system before it ships.
        </h2>
        <p className="mt-3 max-w-[520px] text-[14.5px] leading-[1.6] text-pretty text-ink-2">
          Free and open source. If it helps you think, a star on GitHub helps other engineers find it.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <OpenCanvasButton />
          <Button variant="secondary" size="md" className="h-10 px-4 text-[14px]" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GithubIcon className="size-4" />
              Star on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
