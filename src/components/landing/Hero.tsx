'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { createFromTemplate } from '@/components/project/project-io';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DASHBOARD_PATH, canvasPath } from '@/lib/routes';
import { HERO_TEMPLATES, HERO_TEMPLATE_IDS, type HeroTemplateId } from './hero-templates';

// React Flow is client-only and the heaviest part of the page; the static HTML ships
// without it and the window shows its dot grid until it loads.
const HeroCanvas = dynamic(() => import('./HeroCanvas').then((m) => m.HeroCanvas), {
  ssr: false,
  loading: () => null,
});

/** Time each template stays on screen before the hero moves to the next one. */
const CYCLE_MS = 7000;

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function Hero() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<HeroTemplateId>('microservices');
  const [autoplay, setAutoplay] = useState(true);
  const [visible, setVisible] = useState(true);
  const [opening, setOpening] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const narrow = useMediaQuery('(max-width: 767px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const template = HERO_TEMPLATES.find((t) => t.id === templateId) ?? HERO_TEMPLATES[0];
  const components = template.nodes.filter((n) => n.type === 'system').length;

  // Cycle through templates while the window is on screen, until the visitor takes over.
  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || reducedMotion || !visible) return;
    const timer = window.setTimeout(() => {
      const next = HERO_TEMPLATE_IDS[(HERO_TEMPLATE_IDS.indexOf(templateId) + 1) % HERO_TEMPLATE_IDS.length];
      setTemplateId(next);
    }, CYCLE_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, reducedMotion, visible, templateId]);

  const stopAutoplay = useCallback(() => setAutoplay(false), []);

  const openCanvas = () => {
    if (opening) return;
    setOpening(true);
    const project = createFromTemplate(templateId);
    router.push(project ? canvasPath(project.id) : DASHBOARD_PATH);
  };

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="landing-glow pointer-events-none absolute inset-x-0 top-0 h-[560px]" />
      <div className="relative mx-auto grid max-w-[1128px] justify-items-center px-4 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="landing-rise inline-flex items-center gap-2 rounded-full border border-line bg-paper py-1 pr-3 pl-2 text-[12px] text-ink-2 shadow-[var(--shadow)]">
          <span className="inline-flex size-1.5 rounded-full bg-ok" aria-hidden />
          Open source · runs entirely in your browser
        </p>
        <h1
          className="landing-rise mt-5 max-w-[760px] text-[34px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-ink sm:text-[40px] lg:text-[48px]"
          style={{ animationDelay: '60ms' }}
        >
          Think through the system <span className="text-ink-3">before you build it.</span>
        </h1>
        <p
          className="landing-rise mt-4 max-w-[600px] text-[15px] leading-[1.55] text-pretty text-ink-2 sm:text-[16px]"
          style={{ animationDelay: '120ms' }}
        >
          An opinionated architecture canvas for backend engineers. Services, queues, caches and the
          protocols between them are the building blocks, not boxes and arrows you style by hand. No sign-up;
          your designs never leave this device.
        </p>
        <div
          className="landing-rise mt-7 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: '180ms' }}
        >
          <Button variant="primary" size="md" className="h-10 px-5 text-[14px]" onClick={openCanvas} disabled={opening}>
            Open the canvas
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="secondary" size="md" className="h-10 px-4 text-[14px]" asChild>
            <Link href={DASHBOARD_PATH}>Your projects</Link>
          </Button>
        </div>
        <p className="landing-rise mt-3 text-[12px] text-ink-3" style={{ animationDelay: '220ms' }}>
          Opens the <span className="font-medium text-ink-2">{template.name}</span> template · saved in your
          browser
        </p>
      </div>

      <div className="relative mx-auto mt-10 max-w-[1128px] px-4 pb-6 sm:mt-12 sm:px-6">
        <div
          ref={windowRef}
          className="landing-rise overflow-hidden rounded-[16px] border border-line bg-paper shadow-[var(--shadow-lg)]"
          style={{ animationDelay: '260ms' }}
          onPointerDown={stopAutoplay}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2.5 sm:px-3.5">
            <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="text-ink-3">Templates</span>
              <span className="text-ink-3">/</span>
              <span className="truncate font-medium text-ink">{template.name}</span>
            </div>
            <span className="hidden font-mono text-[11px] text-ink-3 sm:inline">
              {plural(components, 'component')} · {plural(template.edges.length, 'connection')}
            </span>
            <div className="-mx-1 ml-auto max-w-full overflow-x-auto px-1 [scrollbar-width:none]">
              <Segmented
                size="sm"
                aria-label="Template"
                value={templateId}
                onValueChange={(id) => {
                  stopAutoplay();
                  setTemplateId(id);
                }}
                options={HERO_TEMPLATES.map((t) => ({ value: t.id as HeroTemplateId, label: t.name }))}
              />
            </div>
          </div>
          <div
            className="dot-grid relative h-[380px] sm:h-[460px] lg:h-[500px]"
            role="img"
            aria-label={`Live preview: the ${template.name} template, ${template.description}`}
          >
            <HeroCanvas templateId={templateId} narrow={narrow} />
            <div className="pointer-events-none absolute bottom-3 left-3 hidden items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11.5px] text-ink-2 shadow-[var(--shadow)] md:inline-flex">
              <MousePointer2 className="size-3" />
              The real editor components. Drag a node.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
