import type { LucideIcon } from 'lucide-react';
import { FileDown, FileUp, LayoutTemplate, Link2, Presentation } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { TEMPLATES } from '@/lib/templates';
import { SectionHeading } from './SectionHeading';

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: LayoutTemplate,
    title: `${TEMPLATES.length} templates`,
    body: 'Microservices, event-driven, serverless, data pipelines, Kubernetes. Start from a real shape.',
  },
  {
    icon: FileUp,
    title: 'Import',
    body: 'A docker-compose.yml becomes services, databases and queues wired by depends_on.',
  },
  {
    icon: Presentation,
    title: 'Present',
    body: 'Walk the room through it one component at a time, each with its own story card.',
  },
  {
    icon: FileDown,
    title: 'Export',
    body: 'PNG up to 3×, SVG, Mermaid for your docs, JSON for backups.',
  },
  {
    icon: Link2,
    title: 'Share a link',
    body: 'The design is compressed into the URL. No server ever sees it.',
  },
];

/** The rest of the workflow, kept short: getting a design in, and getting it in front of people. */
export function Features() {
  return (
    <section className="mx-auto max-w-[1128px] px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading eyebrow="From sketch to review" title="Everything a design doc needs, nothing it doesn't.">
        Built for the hour before an architecture review, and for keeping the diagram honest afterwards.
      </SectionHeading>

      <ul className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 lg:block">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] leading-5 font-semibold text-ink lg:mt-3">{title}</h3>
              <p className="mt-1 text-[13px] leading-[1.55] text-ink-2">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-3">
        Plus auto-layout, groups and sticky notes, undo/redo, a command menu on
        <Kbd>⌘K</Kbd>
        and every shortcut behind
        <Kbd>?</Kbd>
      </p>
    </section>
  );
}
