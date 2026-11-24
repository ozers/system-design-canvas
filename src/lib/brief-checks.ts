import type { SystemEdge, SystemEdgeType, SystemNode, SystemNodeType } from '@/types';
import { computeIssues } from './validation';

type Types = SystemNodeType[];

/**
 * A structural check on a design. Checks look at component types and how they are
 * connected (in either direction), never at labels or numbers, so they are a
 * checklist of the usual building blocks and not a grade.
 */
export type BriefCheck = { id: string; label: string } & (
  /** At least `min` (default 1) components of one of these types. */
  | { kind: 'has'; types: Types; min?: number }
  /** A direct connection between an `a` component and a `b` component, optionally of a given protocol. */
  | { kind: 'linked'; a: Types; b: Types; protocols?: SystemEdgeType[] }
  /** A `via` component sits between a `from` and a `to` component. */
  | { kind: 'via'; from: Types; via: Types; to: Types }
  /** No component is left unconnected. */
  | { kind: 'clean' }
);

export interface CheckResult {
  id: string;
  label: string;
  pass: boolean;
}

function isComponent(node: SystemNode) {
  return node.type !== 'group' && node.type !== 'note';
}

/** Ids reachable from `start` without stepping onto a blocked component. */
function reach(start: string[], blocked: Set<string>, neighbours: Map<string, string[]>): Set<string> {
  const seen = new Set(start);
  const queue = [...start];
  while (queue.length > 0) {
    const id = queue.pop()!;
    for (const next of neighbours.get(id) ?? []) {
      if (seen.has(next) || blocked.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** Run a brief's checks against the canvas. */
export function evaluateChecks(checks: BriefCheck[], nodes: SystemNode[], edges: SystemEdge[]): CheckResult[] {
  const components = nodes.filter(isComponent);
  const typeOf = new Map(components.map((node) => [node.id, node.data.nodeType]));
  const idsOf = (types: Types) => components.filter((node) => types.includes(node.data.nodeType)).map((node) => node.id);

  const links = edges.filter((edge) => typeOf.has(edge.source) && typeOf.has(edge.target) && edge.source !== edge.target);
  const neighbours = new Map<string, string[]>();
  for (const edge of links) {
    neighbours.set(edge.source, [...(neighbours.get(edge.source) ?? []), edge.target]);
    neighbours.set(edge.target, [...(neighbours.get(edge.target) ?? []), edge.source]);
  }

  const passes = (check: BriefCheck): boolean => {
    switch (check.kind) {
      case 'has':
        return idsOf(check.types).length >= (check.min ?? 1);
      case 'linked':
        return links.some((edge) => {
          if (check.protocols && !check.protocols.includes(edge.data?.edgeType ?? 'rest')) return false;
          const source = typeOf.get(edge.source)!;
          const target = typeOf.get(edge.target)!;
          return (
            (check.a.includes(source) && check.b.includes(target)) || (check.a.includes(target) && check.b.includes(source))
          );
        });
      case 'via': {
        const from = idsOf(check.from);
        const to = idsOf(check.to);
        if (from.length === 0 || to.length === 0) return false;
        // The middle component must be reachable from the start without passing the
        // destination, and lead on to the destination without going back through the start.
        const fromSide = reach(from, new Set(to), neighbours);
        return idsOf(check.via).some((mid) => {
          if (!fromSide.has(mid)) return false;
          const toSide = reach([mid], new Set(from.filter((id) => id !== mid)), neighbours);
          return to.some((id) => id !== mid && toSide.has(id));
        });
      }
      case 'clean':
        return components.length > 0 && !computeIssues(nodes, edges).some((issue) => issue.id.startsWith('disconnected-'));
    }
  };

  return checks.map((check) => ({ id: check.id, label: check.label, pass: passes(check) }));
}
