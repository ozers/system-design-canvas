import { Info, TriangleAlert } from 'lucide-react';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { IconChip } from '@/components/ui/panel';
import { cn } from '@/lib/utils';
import type { SystemNodeType } from '@/types';
import { SectionHeading } from './SectionHeading';

/** Mock of the canvas "things to check" panel. */
function ChecksDemo() {
  const rows = [
    { tone: 'bg-warn', name: 'Orders DB', text: 'is over capacity: 1.2k of 1k req/s' },
    { tone: 'bg-warn', name: 'Email worker', text: 'has no connections' },
    { tone: 'bg-ink-3', name: 'Order service', text: 'has 5 connections — potential bottleneck' },
  ];
  return (
    <div className="overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow)]">
      <div className="flex h-9 items-center gap-2 border-b border-line-2 px-3 text-[12.5px] font-medium text-ink">
        <TriangleAlert className="size-3.5 text-warn" />
        3 things to check
        <span className="ml-auto font-mono text-[11px] font-normal text-ink-3">2 warn · 1 info</span>
      </div>
      <ul className="grid gap-2 px-3 py-2.5 text-[12px] leading-[1.4]">
        {rows.map((row) => (
          <li key={row.name} className="flex items-start gap-2">
            <span aria-hidden className={cn('mt-[5px] size-1.5 shrink-0 rounded-full', row.tone)} />
            <span className="min-w-0">
              <span className="font-medium text-ink">{row.name}</span> <span className="text-ink-2">{row.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mock of a node card with its capacity footer. */
function MiniNode({
  type,
  label,
  tech,
  figures,
  percent,
  tone,
}: {
  type: SystemNodeType;
  label: string;
  tech: string;
  figures: string;
  percent: string;
  tone: string;
}) {
  const config = NODE_REGISTRY[type];
  const Icon = config.icon;
  return (
    <div className="rounded-[12px] border border-line bg-paper p-3 shadow-[var(--shadow)]">
      <div className="flex items-center gap-2.5">
        <IconChip color={config.color} size={28}>
          <Icon className="size-3.5" />
        </IconChip>
        <div className="min-w-0">
          <div className="truncate text-[13px] leading-[17px] font-semibold text-ink">{label}</div>
          <div className="truncate text-[11px] leading-[14px] text-ink-3">{tech}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 font-mono text-[11px] leading-[14px] text-ink-3">
        <span className="min-w-0 truncate">{figures}</span>
        <span className={cn('ml-auto shrink-0', tone)}>{percent}</span>
      </div>
    </div>
  );
}

function CapacityDemo() {
  return (
    <div className="grid gap-2">
      <MiniNode type="database" label="Orders DB" tech="PostgreSQL · 2 instances" figures="1.2k / 1k req/s" percent="120%" tone="font-semibold text-danger" />
      <MiniNode type="cache" label="Session cache" tech="Redis" figures="8.5k / 10k req/s" percent="85%" tone="text-warn" />
    </div>
  );
}

/** Mock of the "Edit with AI" change preview. */
function AiDemo() {
  const rows: { mark: string; tone: string; text: string; detail?: string }[] = [
    { mark: '+', tone: 'text-ok', text: 'Read replica' },
    { mark: '+', tone: 'text-ok', text: 'API → Read replica · db-query' },
    { mark: '~', tone: 'text-ink-3', text: 'API', detail: 'tech' },
    { mark: '−', tone: 'text-danger', text: 'API → Cache · tcp' },
  ];
  return (
    <div className="overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow)]">
      <div className="flex h-9 items-center gap-3 border-b border-line-2 px-3 text-[12px] text-ink-2">
        <span>
          Components <span className="font-mono text-ink">+1 ~1</span>
        </span>
        <span>
          Connections <span className="font-mono text-ink">+1 −1</span>
        </span>
      </div>
      <ul className="grid gap-1 px-3 py-2.5 text-[12px] leading-[1.5]">
        {rows.map((row) => (
          <li key={row.text} className="flex items-baseline gap-2">
            <span aria-hidden className={cn('w-3 shrink-0 text-center font-mono', row.tone)}>
              {row.mark}
            </span>
            <span className="min-w-0 truncate text-ink">{row.text}</span>
            {row.detail && <span className="font-mono text-[11px] text-ink-3">{row.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const POINTS = [
  {
    title: 'It reads the design back to you',
    body: 'Disconnected components, hubs with too many connections and databases nothing writes to are flagged while you draw, with a click to jump to each one.',
    demo: <ChecksDemo />,
  },
  {
    title: 'It does the capacity sums',
    body: 'Say what one instance can take and how many there are, and write a throughput on the connections coming in. The card shows load against limit. It adds up your numbers; it does not simulate traffic.',
    demo: <CapacityDemo />,
  },
  {
    title: 'It works with the AI you already use',
    body: 'Copy a prompt that holds your design, paste the answer back, and review every change before it lands. This page calls no model and sends nothing anywhere.',
    demo: <AiDemo />,
  },
];

/** What the canvas does beyond drawing: checks, capacity arithmetic and AI round-trips. */
export function Think() {
  return (
    <section className="mx-auto max-w-[1128px] px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading eyebrow="More than a drawing" title="A diagram that answers back.">
        Boxes and arrows never tell you what you missed. This canvas knows what a queue and a database are, so it can
        point at the gaps.
      </SectionHeading>

      <ul className="mt-10 grid gap-x-6 gap-y-10 lg:grid-cols-3">
        {POINTS.map(({ title, body, demo }) => (
          <li key={title} className="flex flex-col">
            <div className="dot-grid flex min-h-[188px] items-center rounded-[14px] lg:h-[208px] border border-line p-4 [background-size:14px_14px] sm:p-5">
              <div className="w-full">{demo}</div>
            </div>
            <h3 className="mt-4 text-[15px] leading-5 font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">{body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex items-center gap-1.5 text-[12.5px] text-ink-3">
        <Info className="size-3.5 shrink-0" />
        The panels above are illustrations of the editor, with made-up numbers.
      </p>
    </section>
  );
}
