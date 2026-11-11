import type { LucideIcon } from 'lucide-react';
import { FileDown, FileUp, LayoutTemplate, Link2, Presentation, TriangleAlert } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { Tag } from '@/components/ui/tag';
import { TEMPLATES } from '@/lib/templates';
import { SectionHeading } from './SectionHeading';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  demo: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    icon: LayoutTemplate,
    title: `${TEMPLATES.length} templates`,
    body: 'Start from a real shape: microservices, event-driven, serverless, data pipelines, Kubernetes. Change it until it is yours.',
    demo: (
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATES.slice(0, 5).map((t) => (
          <span key={t.id} className="rounded-full border border-line px-2.5 py-0.5 text-[11.5px] text-ink-2">
            {t.name}
          </span>
        ))}
        <span className="rounded-full px-1.5 py-0.5 text-[11.5px] text-ink-3">+{TEMPLATES.length - 5}</span>
      </div>
    ),
  },
  {
    icon: TriangleAlert,
    title: 'Design checks',
    body: 'Flags disconnected components, likely bottlenecks and missing tech stacks while you work, not in the review.',
    demo: (
      <ul className="grid gap-1.5 text-[12px] text-ink-2">
        <li className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-warn" aria-hidden />
          <span className="min-w-0 truncate">
            <span className="font-medium text-ink">Order Service</span> has 4 connections — potential bottleneck
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-warn" aria-hidden />
          <span className="min-w-0 truncate">
            <span className="font-medium text-ink">Notification</span> has no tech stack specified
          </span>
        </li>
      </ul>
    ),
  },
  {
    icon: Presentation,
    title: 'Presentation mode',
    body: 'Walk the room through the design one component at a time. Everything else dims; each node gets its own story card.',
    demo: (
      <div className="flex items-center gap-2 text-[12px] text-ink-2">
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 rounded-full ${i === 1 ? 'w-4 bg-ink-2' : 'w-1.5 bg-line'}`} />
          ))}
        </span>
        <span className="font-mono text-[11px] text-ink-3">2 / 5</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-ink-3">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </span>
      </div>
    ),
  },
  {
    icon: FileUp,
    title: 'Import what you already have',
    body: 'Drop a docker-compose.yml and get services, databases and queues wired by depends_on. API endpoint lists and project JSON work too.',
    demo: (
      <pre className="overflow-hidden rounded-[9px] bg-line-2 px-3 py-2 font-mono text-[11px] leading-[1.6] text-ink-2">
        {'services:\n  api:\n    depends_on: [db, redis]'}
      </pre>
    ),
  },
  {
    icon: FileDown,
    title: 'Export anywhere',
    body: 'PNG up to 3× with a transparent background, crisp SVG, Mermaid for your docs, JSON for backups.',
    demo: (
      <div className="flex flex-wrap gap-1.5">
        {['PNG', 'SVG', 'Mermaid', 'JSON'].map((f) => (
          <Tag key={f}>{f}</Tag>
        ))}
      </div>
    ),
  },
  {
    icon: Link2,
    title: 'Share as a link',
    body: 'The whole design is compressed into the URL. Whoever opens it previews the diagram and saves their own copy; no server sees it.',
    demo: (
      <div className="truncate rounded-full border border-line px-3 py-1 font-mono text-[11px] text-ink-3">
        /canvas/shared#d=N4IgLgpgtgxgFghgJwQ…
      </div>
    ),
  },
];

export function Features() {
  return (
    <section className="border-y border-line bg-paper">
      <div className="mx-auto max-w-[1128px] px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="From sketch to review" title="Everything a design doc needs, nothing it doesn't.">
          Built for the hour before an architecture review or a system design interview, and for keeping the
          diagram honest afterwards.
        </SectionHeading>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, demo }) => (
            <li
              key={title}
              className="landing-card group flex flex-col rounded-[14px] border border-line bg-bg p-4 sm:p-5"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
                <Icon className="size-4" />
              </span>
              <h3 className="mt-3.5 text-[15px] leading-5 font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">{body}</p>
              <div className="mt-auto pt-4">{demo}</div>
            </li>
          ))}
        </ul>

        <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-3">
          Plus auto-layout, groups and sticky notes, undo/redo, a command menu on
          <Kbd>⌘K</Kbd>
          and every shortcut behind
          <Kbd>?</Kbd>
        </p>
      </div>
    </section>
  );
}
