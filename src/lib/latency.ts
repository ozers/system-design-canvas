import type { SystemEdge, SystemEdgeType, SystemNode } from '@/types';

/**
 * Request-path latency, as arithmetic on what the user wrote: the slowest chain of
 * synchronous connections leading to a component, adding up their latency text.
 */
export interface PathLatency {
  /** Sum of the latencies along the slowest path that ends at this component. */
  ms: number;
  /** Component ids from the entry point to this component. */
  path: string[];
  /** False when a connection on the path has no latency, so `ms` is a lower bound. */
  complete: boolean;
}

/** A caller waits for these; pub/sub, streams and sockets hand off and return. */
const SYNC: ReadonlySet<SystemEdgeType> = new Set(['rest', 'grpc', 'graphql', 'tcp', 'db-query']);

export function isSyncProtocol(type: SystemEdgeType | undefined): boolean {
  return SYNC.has(type ?? 'rest');
}

const UNIT_MS: Record<string, number> = {
  us: 0.001,
  µs: 0.001,
  μs: 0.001,
  ms: 1,
  s: 1000,
  sec: 1000,
  secs: 1000,
  m: 60000,
  min: 60000,
  mins: 60000,
};

/**
 * Read a latency as milliseconds: "~50ms", "0.2 s", "p99 120 ms", "10-20ms" (upper end).
 * A bare number counts as milliseconds. Returns null when there is no number.
 */
export function parseLatency(text: string | undefined): number | null {
  if (!text) return null;
  const clean = text.toLowerCase().replace(/(\d),(\d{3})/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  // Prefer the number that carries a unit, so "p99 120ms" reads 120 and not 99.
  const withUnit = [...clean.matchAll(/(\d+(?:\.\d+)?)\s*(µs|μs|us|ms|secs?|s|mins?|m)(?![a-z])/g)].pop();
  if (withUnit) return Number(withUnit[1]) * UNIT_MS[withUnit[2]];
  // Otherwise only a number standing on its own ("40", "< 10"), not one inside a word ("p99").
  const bare = /^[^a-z\d]*(\d+(?:\.\d+)?)\s*$/.exec(clean);
  return bare ? Number(bare[1]) : null;
}

/** "145 ms", "1.2 s", "0.4 ms". */
export function formatLatency(ms: number): string {
  if (ms >= 1000) return `${Math.round(ms / 100) / 10} s`;
  if (ms >= 10) return `${Math.round(ms)} ms`;
  return `${Math.round(ms * 10) / 10} ms`;
}

/**
 * For every component reached through a synchronous connection that states a latency,
 * the slowest path leading to it. Cycles are cut where they close.
 */
export function computePathLatency(nodes: SystemNode[], edges: SystemEdge[]): Map<string, PathLatency> {
  const ids = new Set(nodes.filter((node) => node.type !== 'group' && node.type !== 'note').map((node) => node.id));
  const incoming = new Map<string, { from: string; ms: number | null }[]>();
  for (const edge of edges) {
    if (edge.source === edge.target || !ids.has(edge.source) || !ids.has(edge.target)) continue;
    if (!isSyncProtocol(edge.data?.edgeType)) continue;
    const list = incoming.get(edge.target) ?? [];
    list.push({ from: edge.source, ms: parseLatency(edge.data?.latency) });
    incoming.set(edge.target, list);
  }

  const memo = new Map<string, PathLatency>();
  const visiting = new Set<string>();
  // `cut` reports that a cycle was cut somewhere below. Such a result holds only for the
  // walk it was found on, so it is not remembered; the component gets its own walk later.
  const slowestTo = (id: string): { best: PathLatency; cut: boolean } => {
    const known = memo.get(id);
    if (known) return { best: known, cut: false };
    let best: PathLatency = { ms: 0, path: [id], complete: true };
    let cut = false;
    visiting.add(id);
    for (const hop of incoming.get(id) ?? []) {
      if (visiting.has(hop.from)) {
        cut = true;
        continue;
      }
      const before = slowestTo(hop.from);
      cut ||= before.cut;
      const ms = before.best.ms + (hop.ms ?? 0);
      if (ms > best.ms || (ms === best.ms && best.path.length === 1)) {
        best = { ms, path: [...before.best.path, id], complete: before.best.complete && hop.ms !== null };
      }
    }
    visiting.delete(id);
    if (!cut || visiting.size === 0) memo.set(id, best);
    return { best, cut };
  };

  const result = new Map<string, PathLatency>();
  for (const id of ids) {
    const slowest = slowestTo(id).best;
    if (slowest.ms > 0) result.set(id, slowest);
  }
  return result;
}
