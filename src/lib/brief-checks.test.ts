import { describe, expect, it } from 'vitest';
import { parseDesign, planDesign } from './ai-format';
import { evaluateChecks, type BriefCheck } from './brief-checks';
import { BRIEFS, getBrief } from './briefs';
import type { SystemEdge, SystemEdgeType, SystemNode, SystemNodeType } from '@/types';

function node(id: string, nodeType: SystemNodeType): SystemNode {
  return { id, type: 'system', position: { x: 0, y: 0 }, data: { label: id, nodeType, techStack: [] } };
}

function edge(source: string, target: string, edgeType: SystemEdgeType = 'rest'): SystemEdge {
  return { id: `${source}-${target}`, source, target, type: 'system', data: { edgeType } };
}

function passes(check: BriefCheck, nodes: SystemNode[], edges: SystemEdge[]) {
  return evaluateChecks([check], nodes, edges)[0].pass;
}

describe('evaluateChecks', () => {
  it('has: counts components of the given types', () => {
    const check: BriefCheck = { id: 'c', label: '', kind: 'has', types: ['worker', 'serverless'], min: 2 };
    expect(passes(check, [node('a', 'worker')], [])).toBe(false);
    expect(passes(check, [node('a', 'worker'), node('b', 'serverless')], [])).toBe(true);
  });

  it('linked: needs a direct connection, in either direction, of the right protocol', () => {
    const nodes = [node('c', 'client'), node('s', 'service'), node('d', 'database')];
    const check: BriefCheck = { id: 'c', label: '', kind: 'linked', a: ['service'], b: ['database'] };
    expect(passes(check, nodes, [edge('c', 's')])).toBe(false);
    expect(passes(check, nodes, [edge('d', 's')])).toBe(true);
    const socket: BriefCheck = { id: 'c', label: '', kind: 'linked', a: ['client'], b: ['service'], protocols: ['websocket'] };
    expect(passes(socket, nodes, [edge('c', 's')])).toBe(false);
    expect(passes(socket, nodes, [edge('c', 's', 'websocket')])).toBe(true);
  });

  it('via: the middle component has to sit between the two ends', () => {
    const nodes = [node('s', 'service'), node('q', 'queue'), node('w', 'worker')];
    const check: BriefCheck = { id: 'c', label: '', kind: 'via', from: ['service'], via: ['queue'], to: ['worker'] };
    expect(passes(check, nodes, [edge('s', 'q'), edge('q', 'w')])).toBe(true);
    // A consumer that pulls from the queue draws the arrow the other way round.
    expect(passes(check, nodes, [edge('s', 'q'), edge('w', 'q')])).toBe(true);
    // The queue hangs off the service; the worker is called directly.
    expect(passes(check, nodes, [edge('s', 'q'), edge('s', 'w')])).toBe(false);
    expect(passes(check, nodes, [edge('s', 'w'), edge('w', 'q')])).toBe(false);
    expect(passes(check, nodes, [])).toBe(false);
  });

  it('clean: fails on an empty canvas and on a loose component', () => {
    const check: BriefCheck = { id: 'c', label: '', kind: 'clean' };
    expect(passes(check, [], [])).toBe(false);
    expect(passes(check, [node('a', 'service'), node('b', 'database')], [])).toBe(false);
    expect(passes(check, [node('a', 'service'), node('b', 'database')], [edge('a', 'b')])).toBe(true);
  });

  it('ignores groups and notes', () => {
    const group: SystemNode = { id: 'g', type: 'group', position: { x: 0, y: 0 }, data: { label: 'G', nodeType: 'group', techStack: [] } };
    const check: BriefCheck = { id: 'c', label: '', kind: 'has', types: ['group'] };
    expect(passes(check, [group], [])).toBe(false);
  });
});

describe('briefs', () => {
  it('have unique ids and unique check ids', () => {
    expect(new Set(BRIEFS.map((b) => b.id)).size).toBe(BRIEFS.length);
    for (const brief of BRIEFS) expect(new Set(brief.checks.map((c) => c.id)).size).toBe(brief.checks.length);
    expect(getBrief('chat')?.title).toBe('Chat');
    expect(getBrief('nope')).toBeUndefined();
    expect(getBrief(undefined)).toBeUndefined();
  });

  it.each(BRIEFS.map((b) => [b.id, b] as const))('%s: nothing passes on an empty canvas', (_id, brief) => {
    expect(evaluateChecks(brief.checks, [], []).filter((c) => c.pass)).toEqual([]);
  });

  it.each(BRIEFS.map((b) => [b.id, b] as const))('%s: the reference design is valid and passes every check', (_id, brief) => {
    const parsed = parseDesign(JSON.stringify(brief.reference));
    expect(parsed).toEqual({ ok: true, design: brief.reference });
    const plan = planDesign(brief.reference, [], []);
    expect(evaluateChecks(brief.checks, plan.nodes, plan.edges).filter((c) => !c.pass)).toEqual([]);
  });

  it.each(BRIEFS.map((b) => [b.id, b] as const))('%s: has requirements, scale, checks and hints', (_id, brief) => {
    expect(brief.requirements.length).toBeGreaterThanOrEqual(3);
    expect(brief.scale.length).toBeGreaterThanOrEqual(2);
    expect(brief.checks.length).toBeGreaterThanOrEqual(4);
    expect(brief.hints.length).toBeGreaterThanOrEqual(2);
  });
});
