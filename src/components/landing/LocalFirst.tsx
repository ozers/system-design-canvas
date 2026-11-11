import { HardDrive, KeyRound, ServerOff } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const POINTS = [
  {
    icon: KeyRound,
    title: 'No account',
    body: 'Open the page and start. There is nothing to sign up for and nothing to sign in to.',
  },
  {
    icon: HardDrive,
    title: 'Stays on this device',
    body: 'Designs are saved to your browser’s localStorage as you work. Export JSON whenever you want a backup.',
  },
  {
    icon: ServerOff,
    title: 'No backend at all',
    body: 'The app is static files. No database, no analytics, no API calls with your diagrams in them.',
  },
];

export function LocalFirst() {
  return (
    <section className="mx-auto max-w-[1128px] px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading eyebrow="Local-first" title="Your architecture is nobody else’s business.">
        Internal service names, hostnames and data flows are exactly what you shouldn’t paste into a
        random SaaS. Here they never leave the tab.
      </SectionHeading>
      <ul className="mt-10 grid gap-6 sm:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <span className="inline-flex size-8 items-center justify-center rounded-[9px] border border-line bg-paper text-ink-2 shadow-[var(--shadow)]">
              <Icon className="size-4" />
            </span>
            <h3 className="mt-3 text-[15px] leading-5 font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
