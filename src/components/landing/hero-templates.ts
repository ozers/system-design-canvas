import type { CSSProperties } from 'react';
import { getLayoutedElements } from '@/lib/auto-layout';
import { TEMPLATES } from '@/lib/templates';
import type { SystemEdge, SystemNode } from '@/types';

/** Templates the landing hero can show, in tab order. */
export const HERO_TEMPLATE_IDS = ['microservices', 'event-driven', 'serverless', 'data-pipeline'] as const;
export type HeroTemplateId = (typeof HERO_TEMPLATE_IDS)[number];

export const HERO_TEMPLATES = HERO_TEMPLATE_IDS.map((id) => {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) throw new Error(`Missing template ${id}`);
  return template;
});

/** Delay between nodes as they enter, in layout order. */
const NODE_STAGGER_MS = 70;

/**
 * A template laid out for the hero window: auto-layout left-to-right on wide screens,
 * top-to-bottom on narrow ones, with an entry delay per node (exposed as `--d`).
 */
export function heroGraph(id: HeroTemplateId, direction: 'LR' | 'TB') {
  const template = HERO_TEMPLATES.find((t) => t.id === id) ?? HERO_TEMPLATES[0];
  const { nodes, edges } = getLayoutedElements(
    structuredClone(template.nodes),
    structuredClone(template.edges),
    direction
  );
  const axis = direction === 'LR' ? 'x' : 'y';
  const order = [...nodes].sort((a, b) => a.position[axis] - b.position[axis] || a.id.localeCompare(b.id));
  const delay = new Map(order.map((n, i) => [n.id, i * NODE_STAGGER_MS]));
  const staged: SystemNode[] = nodes.map((n) => ({
    ...n,
    style: { ...n.style, '--d': `${delay.get(n.id) ?? 0}ms` } as CSSProperties,
  }));
  const edgesAt = order.length * NODE_STAGGER_MS + 120;
  return { template, nodes: staged, edges: edges as SystemEdge[], edgesAt };
}
