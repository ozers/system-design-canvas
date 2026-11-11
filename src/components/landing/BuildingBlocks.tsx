import { IconChip } from '@/components/ui/panel';
import { getNodesByCategory } from '@/components/nodes/node-registry';
import { EDGE_REGISTRY, edgeAnimationClass } from '@/components/edges/edge-registry';
import { edgeStroke } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

const groups = getNodesByCategory()
  .map((g) => ({ ...g, types: g.types.filter((t) => t.type !== 'group') }))
  .filter((g) => g.types.length > 0);
const componentCount = groups.reduce((n, g) => n + g.types.length, 0);
const protocols = Object.entries(EDGE_REGISTRY);

/** The node and edge registries, shown as the vocabulary of the canvas. */
export function BuildingBlocks() {
  return (
    <section className="mx-auto max-w-[1128px] px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow="Building blocks"
        title={`${componentCount} components, ${protocols.length} protocols, nothing to draw.`}
      >
        Pick a cache, not a rectangle. Every component carries a tech stack, every connection a protocol,
        so the diagram says what the system actually does.
      </SectionHeading>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-[14px] border border-line bg-paper p-4 shadow-[var(--shadow)] sm:p-5">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.category}>
                <h3 className="text-[11.5px] font-medium text-ink-3">{group.category}</h3>
                <ul className="mt-2 grid gap-1.5">
                  {group.types.map(({ type, config }) => {
                    const Icon = config.icon;
                    return (
                      <li key={type} className="flex items-center gap-2.5 text-[13px] text-ink">
                        <IconChip color={config.color} size={24}>
                          <Icon className="size-3.5" />
                        </IconChip>
                        <span className="min-w-0 truncate">{config.label}</span>
                        {config.defaultTechStack[0] && (
                          <span className="ml-auto hidden font-mono text-[11px] text-ink-3 sm:inline">
                            {config.defaultTechStack[0]}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-paper p-4 shadow-[var(--shadow)] sm:p-5">
          <h3 className="text-[11.5px] font-medium text-ink-3">Connections</h3>
          <ul className="mt-2 grid gap-2.5">
            {protocols.map(([type, config]) => (
              <li key={type} className="flex items-center gap-3">
                <svg width="96" height="10" viewBox="0 0 96 10" aria-hidden className="shrink-0 overflow-visible">
                  <path
                    d="M2 5 H94"
                    fill="none"
                    stroke={edgeStroke(config.color)}
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeDasharray={config.strokeDasharray}
                    className={edgeAnimationClass(config)}
                  />
                  <circle cx="94" cy="5" r="2.5" fill={edgeStroke(config.color)} />
                </svg>
                <span className="text-[13px] text-ink">{config.label}</span>
                <span className="ml-auto text-[11.5px] text-ink-3">
                  {config.animated ? 'async' : 'sync'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
