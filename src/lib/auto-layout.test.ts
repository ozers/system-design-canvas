import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLayoutedElements } from './auto-layout';
import { getNodeRect } from './minimap';
import { TEMPLATES } from './templates';
import type { SystemEdge, SystemEdgeData, SystemNode } from '@/types';

const ASYNC = new Set(['pub-sub', 'mqtt', 'event-stream', 'websocket']);
const HANDLE = /^(top|right|bottom|left)-(source|target)$/;

function overlaps(a: SystemNode, b: SystemNode) {
  const r1 = getNodeRect(a);
  const r2 = getNodeRect(b);
  return r1.x < r2.x + r2.width && r2.x < r1.x + r1.width && r1.y < r2.y + r2.height && r2.y < r1.y + r1.height;
}

function center(node: SystemNode, axis: 'x' | 'y') {
  const r = getNodeRect(node);
  return axis === 'y' ? r.y + r.height / 2 : r.x + r.width / 2;
}

afterEach(() => vi.restoreAllMocks());

describe.each(['TB', 'LR'] as const)('getLayoutedElements (%s)', (direction) => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))('lays out the %s template cleanly', (_id, template) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { nodes, edges } = getLayoutedElements(template.nodes, template.edges, direction);
    expect(error).not.toHaveBeenCalled();

    const layout = nodes.filter((n) => n.type !== 'group' && n.type !== 'note');
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        expect(overlaps(layout[i], layout[j]), `${layout[i].id} overlaps ${layout[j].id}`).toBe(false);
      }
    }

    // Synchronous calls flow along the layout axis: the callee sits after the caller.
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const axis = direction === 'TB' ? 'y' : 'x';
    for (const edge of edges) {
      const type = (edge.data as SystemEdgeData | undefined)?.edgeType ?? 'rest';
      const s = byId.get(edge.source);
      const t = byId.get(edge.target);
      if (!s || !t || ASYNC.has(type) || s.type !== 'system' || t.type !== 'system') continue;
      expect(center(t, axis), `${edge.id} goes backwards`).toBeGreaterThan(center(s, axis));
      expect(edge.sourceHandle).toMatch(HANDLE);
      expect(edge.targetHandle).toMatch(HANDLE);
    }
  });
});

describe('getLayoutedElements', () => {
  it('keeps groups and notes where they are', () => {
    const nodes: SystemNode[] = [
      { id: 'a', type: 'system', position: { x: 0, y: 0 }, data: { label: 'A', nodeType: 'service', techStack: [] } },
      { id: 'b', type: 'system', position: { x: 0, y: 0 }, data: { label: 'B', nodeType: 'database', techStack: [] } },
      { id: 'g', type: 'group', position: { x: 500, y: 500 }, data: { label: 'G', nodeType: 'group', techStack: [] } },
      { id: 'n', type: 'note', position: { x: -50, y: 900 }, data: { label: 'N', nodeType: 'service', techStack: [] } },
    ];
    const edges: SystemEdge[] = [{ id: 'e', source: 'a', target: 'b', type: 'system', data: { edgeType: 'db-query' } }];
    const out = getLayoutedElements(nodes, edges);
    expect(out.nodes.find((n) => n.id === 'g')!.position).toEqual({ x: 500, y: 500 });
    expect(out.nodes.find((n) => n.id === 'n')!.position).toEqual({ x: -50, y: 900 });
    expect(out.edges[0]).toMatchObject({ sourceHandle: 'bottom-source', targetHandle: 'top-target' });
  });

  it('returns input untouched when there is nothing to lay out', () => {
    const nodes: SystemNode[] = [];
    const edges: SystemEdge[] = [];
    expect(getLayoutedElements(nodes, edges)).toEqual({ nodes, edges });
  });
});
