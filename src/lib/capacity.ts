import { createContext, useContext } from 'react';
import type { SystemEdge, SystemNode } from '@/types';

/**
 * Capacity arithmetic, not a simulation: the load on a component is the sum of the
 * throughput written on its incoming connections, and its limit is capacity × instances.
 * Nothing is inferred; a component without both numbers is left alone.
 */
export interface NodeCapacity {
  /** Requests per second arriving, from incoming connections that state a throughput. */
  load: number | null;
  /** Requests per second the component can take: capacity per instance × instances. */
  limit: number | null;
  /** load / limit, when both are known. */
  utilization: number | null;
}

const MULTIPLIERS: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };

/** First number in the text with an optional k / M / B suffix, e.g. "~1.2K" → 1200. */
function leadingNumber(text: string): { value: number; rest: string } | null {
  const match = /(\d+(?:[.,]\d+)?)\s*([kmb])?(?![a-z])/i.exec(text.replace(/(\d),(\d{3})/g, '$1$2'));
  if (!match) return null;
  const value = Number(match[1].replace(',', '.')) * (match[2] ? MULTIPLIERS[match[2].toLowerCase()] : 1);
  if (!Number.isFinite(value)) return null;
  return { value, rest: text.slice(match.index + match[0].length).toLowerCase() };
}

/**
 * Read a rate as requests per second: "1K req/s", "500 rps", "300/min", "2M per day".
 * A bare number counts as per second. Returns null when there is no number or it is a data rate.
 */
export function parseRate(text: string | undefined): number | null {
  if (!text) return null;
  const parsed = leadingNumber(text);
  if (!parsed) return null;
  const { value, rest } = parsed;
  // "2 MB/s" is a data rate, not a request rate; guessing would produce false warnings.
  if (/^\s*([kmgt]i?)?(b|bytes?|bits?|bps)\b/.test(rest)) return null;
  if (/rpm|(\/|per)\s*m(in(ute)?)?\b/.test(rest)) return value / 60;
  if (/(\/|per)\s*h(r|our)?\b/.test(rest)) return value / 3600;
  if (/(\/|per)\s*d(ay)?\b/.test(rest)) return value / 86400;
  return value;
}

/** "1.2k", "850", "3.4M": short enough for a node card. */
export function formatRate(value: number): string {
  const short = (n: number) => (n >= 100 ? Math.round(n).toString() : (Math.round(n * 10) / 10).toString());
  if (value >= 1e9) return `${short(value / 1e9)}B`;
  if (value >= 1e6) return `${short(value / 1e6)}M`;
  if (value >= 1e3) return `${short(value / 1e3)}k`;
  return short(value);
}

/** Load, limit and utilization for every component that has at least one of them. */
export function computeCapacity(nodes: SystemNode[], edges: SystemEdge[]): Map<string, NodeCapacity> {
  const loads = new Map<string, number>();
  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    const rate = parseRate(edge.data?.throughput);
    if (rate === null) continue;
    loads.set(edge.target, (loads.get(edge.target) ?? 0) + rate);
  }

  const result = new Map<string, NodeCapacity>();
  for (const node of nodes) {
    if (node.type === 'group' || node.type === 'note') continue;
    const perInstance = parseRate(node.data.capacity);
    const instances = node.data.instances && node.data.instances > 0 ? node.data.instances : 1;
    const limit = perInstance === null ? null : perInstance * instances;
    const load = loads.get(node.id) ?? null;
    if (limit === null && load === null) continue;
    result.set(node.id, {
      load,
      limit,
      utilization: load !== null && limit !== null && limit > 0 ? load / limit : null,
    });
  }
  return result;
}

/** At or above this share of its limit a component is flagged as close to capacity. */
export const NEAR_CAPACITY = 0.8;

/** Canvas provides it; node cards read their own entry. Empty outside a canvas (e.g. the landing hero). */
export const CapacityContext = createContext<ReadonlyMap<string, NodeCapacity>>(new Map());

export function useNodeCapacity(nodeId: string) {
  return useContext(CapacityContext).get(nodeId);
}
