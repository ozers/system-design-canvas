import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildPrompt,
  FORMAT_GUIDE,
  llmsFullText,
  parseDesign,
  planDesign,
  toDesign,
  type Design,
} from './ai-format';
import { TEMPLATES } from './templates';
import { SYSTEM_EDGE_TYPES, SYSTEM_NODE_TYPES, type SystemEdge, type SystemNode } from '@/types';

const nodes: SystemNode[] = [
  { id: 'g', type: 'group', position: { x: -40, y: -60 }, style: { width: 600, height: 400 }, data: { label: 'Backend', nodeType: 'group', techStack: [] } },
  { id: 'api', type: 'system', position: { x: 10, y: 20 }, draggable: false, data: { label: 'API', nodeType: 'service', description: 'Public API', techStack: ['Node.js'] } },
  { id: 'db', type: 'system', position: { x: 10, y: 300 }, data: { label: 'DB', nodeType: 'database', description: '', techStack: ['PostgreSQL'], owner: 'data' } },
  { id: 'note', type: 'note', position: { x: 400, y: 0 }, data: { label: 'todo', nodeType: 'service', techStack: [] } },
];
const edges: SystemEdge[] = [
  { id: 'e1', source: 'api', target: 'db', sourceHandle: 'left-source', targetHandle: 'left-target', type: 'system', data: { edgeType: 'db-query', label: '', latency: '5 ms' } },
];

function parsed(input: string): Design {
  const result = parseDesign(input);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.design;
}

function errorsOf(input: unknown): string[] {
  const result = parseDesign(typeof input === 'string' ? input : JSON.stringify(input));
  return result.ok ? [] : result.errors;
}

describe('toDesign', () => {
  it('keeps components and their connections, drops groups, notes and empty fields', () => {
    expect(toDesign(nodes, edges)).toEqual({
      format: 'sdc/design@1',
      nodes: [
        { id: 'api', type: 'service', label: 'API', tech: ['Node.js'], description: 'Public API' },
        { id: 'db', type: 'database', label: 'DB', tech: ['PostgreSQL'], owner: 'data' },
      ],
      edges: [{ from: 'api', to: 'db', protocol: 'db-query', latency: '5 ms' }],
    });
  });
});

describe('round trip', () => {
  it('changes nothing when the design comes back untouched', () => {
    const plan = planDesign(parsed(JSON.stringify(toDesign(nodes, edges))), nodes, edges);
    expect(plan.diff.empty).toBe(true);
    expect(plan.nodes).toEqual(nodes);
    expect(plan.edges).toEqual(edges);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))('is a no-op for the %s template', (_id, template) => {
    const design = parsed(`Done.\n\n\`\`\`json\n${JSON.stringify(toDesign(template.nodes, template.edges), null, 2)}\n\`\`\`\n`);
    const plan = planDesign(design, template.nodes, template.edges);
    expect(plan.diff.empty).toBe(true);
    expect(plan.nodes).toEqual(template.nodes);
    expect(plan.edges).toEqual(template.edges);
  });
});

describe('parseDesign', () => {
  it('reads the JSON block out of a chat answer', () => {
    const answer = 'Sure! Here is the design:\n\n```json\n{"nodes":[{"id":"a","type":"Load_Balancer","label":"LB","tech":"Nginx"}],"edges":[]}\n```\n\nI added {nothing}.';
    expect(parsed(answer).nodes).toEqual([{ id: 'a', type: 'load-balancer', label: 'LB', tech: ['Nginx'] }]);
  });

  it('accepts common aliases and drops unknown fields and duplicate edges', () => {
    const design = parsed(JSON.stringify({
      nodes: [
        { id: 'a', type: 'lambda', label: 'Fn', tech: [], x: 10, color: 'red' },
        { id: 'b', type: 'db', name: 'Store' },
      ],
      edges: [
        { source: 'a', target: 'b', protocol: 'SQL', latency: 12 },
        { from: 'a', to: 'b', protocol: 'db-query' },
        { from: 'b', to: 'a' },
      ],
    }));
    expect(design.nodes).toEqual([
      { id: 'a', type: 'serverless', label: 'Fn', tech: [] },
      { id: 'b', type: 'database', label: 'Store', tech: [] },
    ]);
    expect(design.edges).toEqual([
      { from: 'a', to: 'b', protocol: 'db-query', latency: '12' },
      { from: 'b', to: 'a', protocol: 'rest' },
    ]);
  });

  it('explains what is wrong in plain words', () => {
    expect(errorsOf('hello')[0]).toMatch(/No JSON found/);
    expect(errorsOf('{"nodes": [,]}')[0]).toMatch(/not valid/);
    expect(errorsOf({ components: [] })[0]).toMatch(/no "nodes" list/);
    const errors = errorsOf({
      nodes: [
        { id: 'a', type: 'redis', label: 'Cache' },
        { id: 'b', type: 'service', label: 'B', tech: [] },
        { id: 'b', type: 'service', label: 'B2', tech: [] },
        { id: 'c', type: 'group', label: 'Group' },
        { id: 'd', type: 'service', label: 'D', links: [{ label: 'x', url: 'javascript:alert(1)' }] },
      ],
      edges: [
        { from: 'b', to: 'zzz', protocol: 'rest' },
        { from: 'b', to: 'b', protocol: 'rest' },
        { from: 'b', to: 'd', protocol: 'carrier-pigeon' },
      ],
    });
    expect(errors.join('\n')).toMatch(/Node 1 \("Cache"\): type "redis" is not a component type/);
    expect(errors.join('\n')).toMatch(/the id "b" is used twice/);
    expect(errors.join('\n')).toMatch(/Node 4 \("Group"\): type "group"/);
    expect(errors.join('\n')).toMatch(/must start with http/);
    expect(errors.join('\n')).toMatch(/no node with the id "zzz"/);
    expect(errors.join('\n')).toMatch(/…and \d+ more/);
  });

  it('refuses oversized designs', () => {
    const many = Array.from({ length: 201 }, (_, i) => ({ id: `n${i}`, type: 'service', label: `N${i}`, tech: [] }));
    expect(errorsOf({ nodes: many })[0]).toMatch(/Too many nodes: 201/);
  });
});

describe('planDesign', () => {
  const base = () => toDesign(nodes, edges);

  it('keeps position, lock, groups and notes when a node changes', () => {
    const design = base();
    design.nodes[0] = { ...design.nodes[0], label: 'Gateway API', tech: ['Go'], description: undefined };
    const plan = planDesign(design, nodes, edges);
    expect(plan.diff.changedNodes).toEqual([{ label: 'Gateway API', fields: expect.arrayContaining(['label', 'tech', 'description']) }]);
    const api = plan.nodes.find((n) => n.id === 'api')!;
    expect(api.position).toEqual({ x: 10, y: 20 });
    expect(api.draggable).toBe(false);
    expect(api.data).toEqual({ label: 'Gateway API', nodeType: 'service', description: '', techStack: ['Go'] });
    expect(plan.nodes.map((n) => n.id)).toEqual(['g', 'api', 'db', 'note']);
    expect(plan.nodes[0]).toBe(nodes[0]);
    expect(plan.nodes[2]).toBe(nodes[2]);
  });

  it('places a new node near its neighbour without moving or overlapping anything', () => {
    const design = base();
    design.nodes.push({ id: 'cache', type: 'cache', label: 'Cache', tech: ['Redis'] });
    design.edges.push({ from: 'api', to: 'cache', protocol: 'db-query' });
    const plan = planDesign(design, nodes, edges);
    expect(plan.diff).toMatchObject({ addedNodes: ['Cache'], addedEdges: ['API → Cache · db-query'], relayout: false, empty: false });
    expect(plan.nodes.find((n) => n.id === 'api')!.position).toEqual({ x: 10, y: 20 });
    expect(plan.nodes.find((n) => n.id === 'db')!.position).toEqual({ x: 10, y: 300 });
    const cache = plan.nodes.find((n) => n.id === 'cache')!;
    expect(cache.type).toBe('system');
    for (const other of plan.nodes.filter((n) => n.type === 'system' && n.id !== 'cache')) {
      const apart = Math.abs(cache.position.x - other.position.x) >= 200 || Math.abs(cache.position.y - other.position.y) >= 72;
      expect(apart).toBe(true);
    }
    const fresh = plan.edges.find((e) => e.target === 'cache')!;
    expect(fresh.sourceHandle).toMatch(/^(top|right|bottom|left)-source$/);
    expect(fresh.targetHandle).toMatch(/^(top|right|bottom|left)-target$/);
    // The existing connection keeps the handles the user picked.
    expect(plan.edges.find((e) => e.id === 'e1')).toBe(edges[0]);
  });

  it('removes what the design leaves out', () => {
    const design = base();
    design.nodes = design.nodes.filter((n) => n.id !== 'db');
    design.edges = [];
    const plan = planDesign(design, nodes, edges);
    expect(plan.diff.removedNodes).toEqual(['DB']);
    expect(plan.diff.removedEdges).toEqual(['API → DB · db-query']);
    expect(plan.nodes.map((n) => n.id)).toEqual(['g', 'api', 'note']);
    expect(plan.edges).toEqual([]);
  });

  it('keeps the edge id and handles when only the protocol changes', () => {
    const design = base();
    design.edges[0] = { from: 'api', to: 'db', protocol: 'tcp' };
    const plan = planDesign(design, nodes, edges);
    expect(plan.diff.changedEdges).toEqual(['API → DB · tcp']);
    expect(plan.diff.addedEdges).toEqual([]);
    expect(plan.edges).toEqual([{ ...edges[0], data: { edgeType: 'tcp', label: '' } }]);
  });

  it('lays the whole canvas out when most of it is new', () => {
    const design = parsed(JSON.stringify({
      nodes: [
        { id: 'web', type: 'client', label: 'Web', tech: [] },
        { id: 'svc', type: 'service', label: 'Svc', tech: [] },
        { id: 'store', type: 'database', label: 'Store', tech: [] },
      ],
      edges: [{ from: 'web', to: 'svc', protocol: 'rest' }, { from: 'svc', to: 'store', protocol: 'db-query' }],
    }));
    const plan = planDesign(design, [], []);
    expect(plan.diff.relayout).toBe(true);
    const ys = ['web', 'svc', 'store'].map((id) => plan.nodes.find((n) => n.id === id)!.position.y);
    expect(ys[0]).toBeLessThan(ys[1]);
    expect(ys[1]).toBeLessThan(ys[2]);
    expect(new Set(plan.edges.map((e) => e.id)).size).toBe(2);
  });

  it('renames a new id that collides with a group or note', () => {
    const design = base();
    design.nodes.push({ id: 'note', type: 'queue', label: 'Jobs', tech: [] });
    design.edges.push({ from: 'api', to: 'note', protocol: 'pub-sub' });
    const plan = planDesign(design, nodes, edges);
    expect(plan.nodes.filter((n) => n.id === 'note')).toHaveLength(1);
    const queue = plan.nodes.find((n) => n.id === 'note-ai')!;
    expect(queue.data.nodeType).toBe('queue');
    expect(plan.edges.some((e) => e.source === 'api' && e.target === 'note-ai')).toBe(true);
  });
});

describe('format guide', () => {
  it('lists every component type and protocol', () => {
    for (const type of SYSTEM_NODE_TYPES.filter((t) => t !== 'group')) expect(FORMAT_GUIDE).toContain(`\`${type}\``);
    for (const type of SYSTEM_EDGE_TYPES) expect(FORMAT_GUIDE).toContain(`\`${type}\``);
    expect(FORMAT_GUIDE).not.toContain('`group`');
  });

  it('has a valid example', () => {
    expect(parseDesign(FORMAT_GUIDE).ok).toBe(true);
  });

  it('puts the request and the design into the prompt', () => {
    const prompt = buildPrompt(toDesign(nodes, edges), '  add a cache  ');
    expect(prompt).toContain('## Requested change\n\nadd a cache\n');
    expect(prompt).toContain('"id": "api"');
  });

  // Regenerate with: UPDATE_LLMS=1 npm test
  it('matches public/llms-full.txt', () => {
    const path = fileURLToPath(new URL('../../public/llms-full.txt', import.meta.url));
    if (process.env.UPDATE_LLMS) writeFileSync(path, llmsFullText());
    expect(readFileSync(path, 'utf8')).toBe(llmsFullText());
  });
});
