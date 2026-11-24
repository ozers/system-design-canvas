import { describe, expect, it } from 'vitest';
import { computeCapacity, formatRate, parseRate } from './capacity';
import { computeIssues } from './validation';
import type { SystemEdge, SystemNode, SystemNodeData } from '@/types';

function node(id: string, data: Partial<SystemNodeData> = {}): SystemNode {
  return { id, type: 'system', position: { x: 0, y: 0 }, data: { label: id, nodeType: 'service', techStack: [], ...data } };
}

function edge(source: string, target: string, throughput?: string): SystemEdge {
  return { id: `${source}-${target}`, source, target, type: 'system', data: { edgeType: 'rest', throughput } };
}

describe('parseRate', () => {
  it.each([
    ['1K req/s', 1000],
    ['~1.2k rps', 1200],
    ['500', 500],
    ['500/s', 500],
    ['2,500 req/s', 2500],
    ['1,5k', 1500],
    ['3M per day', 3e6 / 86400],
    ['300/min', 5],
    ['600 rpm', 10],
    ['7200 per hour', 2],
  ])('%s → %d', (text, expected) => {
    expect(parseRate(text)).toBeCloseTo(expected, 6);
  });

  it('returns null without a number', () => {
    expect(parseRate(undefined)).toBeNull();
    expect(parseRate('')).toBeNull();
    expect(parseRate('high')).toBeNull();
  });

  it('does not read a data rate as requests', () => {
    for (const text of ['2 MB/s', '500 kb/s', '1 GiB per day', '10 Mbps', '64 bytes']) expect(parseRate(text)).toBeNull();
  });
});

describe('formatRate', () => {
  it('keeps numbers short', () => {
    expect([12.34, 850, 1200, 15000, 3_400_000].map(formatRate)).toEqual(['12.3', '850', '1.2k', '15k', '3.4M']);
  });
});

describe('computeCapacity', () => {
  it('sums incoming throughput and multiplies capacity by instances', () => {
    const nodes = [node('a'), node('b'), node('db', { capacity: '500 req/s', instances: 3 })];
    const edges = [edge('a', 'db', '900/s'), edge('b', 'db', '300/s'), edge('db', 'a', '50/s')];
    const result = computeCapacity(nodes, edges);
    expect(result.get('db')).toEqual({ load: 1200, limit: 1500, utilization: 0.8 });
    // Load without a limit is reported, but there is nothing to compare it to.
    expect(result.get('a')).toEqual({ load: 50, limit: null, utilization: null });
    expect(result.has('b')).toBe(false);
  });

  it('treats a missing or invalid instance count as one', () => {
    const result = computeCapacity([node('x', { capacity: '100', instances: 0 })], []);
    expect(result.get('x')).toEqual({ load: null, limit: 100, utilization: null });
  });

  it('skips groups and notes', () => {
    const group: SystemNode = { id: 'g', type: 'group', position: { x: 0, y: 0 }, data: { label: 'G', nodeType: 'group', techStack: [], capacity: '10' } };
    expect(computeCapacity([group], []).size).toBe(0);
  });
});

describe('capacity issues', () => {
  const issuesFor = (throughput: string) =>
    computeIssues([node('api'), node('db', { label: 'Orders DB', capacity: '1k req/s' })], [edge('api', 'db', throughput)])
      .filter((issue) => issue.id.includes('capacity'));

  it('warns when the load is over the limit', () => {
    expect(issuesFor('1.2k req/s')).toEqual([
      { id: 'over-capacity-db', nodeId: 'db', nodeLabel: 'Orders DB', severity: 'warning', message: 'is over capacity: 1.2k of 1k req/s' },
    ]);
  });

  it('notes a component that is close to its limit', () => {
    expect(issuesFor('850')).toEqual([
      { id: 'near-capacity-db', nodeId: 'db', nodeLabel: 'Orders DB', severity: 'info', message: 'is at 85% of capacity (850 of 1k req/s)' },
    ]);
  });

  it('says nothing with headroom or without numbers', () => {
    expect(issuesFor('400')).toEqual([]);
    expect(issuesFor('a lot')).toEqual([]);
  });
});
