import { describe, expect, it } from 'vitest';
import { computePathLatency, formatLatency, parseLatency } from './latency';
import type { SystemEdge, SystemEdgeType, SystemNode } from '@/types';

function node(id: string): SystemNode {
  return { id, type: 'system', position: { x: 0, y: 0 }, data: { label: id, nodeType: 'service', techStack: [] } };
}

function edge(source: string, target: string, latency?: string, edgeType: SystemEdgeType = 'rest'): SystemEdge {
  return { id: `${source}-${target}`, source, target, type: 'system', data: { edgeType, latency } };
}

describe('parseLatency', () => {
  it.each([
    ['~50ms', 50],
    ['5 ms', 5],
    ['0.2 s', 200],
    ['1.5 sec', 1500],
    ['2 secs', 2000],
    ['200 µs', 0.2],
    ['300us', 0.3],
    ['p99 120 ms', 120],
    ['10-20ms', 20],
    ['1,5 s', 1500],
    ['1,200 ms', 1200],
    ['2 min', 120000],
    ['40', 40],
    ['< 10', 10],
  ])('%s → %d ms', (text, expected) => {
    expect(parseLatency(text)).toBeCloseTo(expected, 6);
  });

  it('returns null without a usable number', () => {
    for (const text of [undefined, '', 'fast', 'p99']) expect(parseLatency(text)).toBeNull();
  });
});

describe('formatLatency', () => {
  it('picks a readable unit', () => {
    expect([0.42, 5, 145.4, 1240, 60000].map(formatLatency)).toEqual(['0.4 ms', '5 ms', '145 ms', '1.2 s', '60 s']);
  });
});

describe('computePathLatency', () => {
  const nodes = ['client', 'lb', 'api', 'db', 'cache', 'queue', 'worker'].map(node);

  it('adds up the slowest synchronous path to each component', () => {
    const result = computePathLatency(nodes, [
      edge('client', 'lb', '5 ms'),
      edge('lb', 'api', '10 ms'),
      edge('api', 'db', '40 ms', 'db-query'),
      edge('api', 'cache', '1 ms', 'tcp'),
      edge('client', 'api', '100 ms'),
    ]);
    expect(result.get('api')).toEqual({ ms: 100, path: ['client', 'api'], complete: true });
    expect(result.get('db')).toEqual({ ms: 140, path: ['client', 'api', 'db'], complete: true });
    expect(result.get('cache')?.ms).toBe(101);
    expect(result.has('client')).toBe(false);
  });

  it('stops at asynchronous hand-offs', () => {
    const result = computePathLatency(nodes, [
      edge('client', 'api', '20 ms'),
      edge('api', 'queue', '2 ms', 'pub-sub'),
      edge('queue', 'worker', '500 ms', 'pub-sub'),
      edge('worker', 'db', '30 ms', 'db-query'),
    ]);
    expect(result.has('queue')).toBe(false);
    expect(result.has('worker')).toBe(false);
    // The worker starts its own path.
    expect(result.get('db')).toEqual({ ms: 30, path: ['worker', 'db'], complete: true });
  });

  it('marks a path with an unlabelled connection as a lower bound', () => {
    const result = computePathLatency(nodes, [edge('client', 'lb'), edge('lb', 'api', '10 ms')]);
    expect(result.has('lb')).toBe(false);
    expect(result.get('api')).toEqual({ ms: 10, path: ['client', 'lb', 'api'], complete: false });
  });

  it('survives a cycle', () => {
    const result = computePathLatency(nodes, [
      edge('client', 'api', '10 ms'),
      edge('api', 'db', '5 ms', 'db-query'),
      edge('db', 'api', '5 ms', 'db-query'),
    ]);
    expect(result.get('db')?.ms).toBe(15);
    expect(result.get('api')?.ms).toBeGreaterThanOrEqual(10);
  });

  it('ignores groups, notes and self-loops', () => {
    const group: SystemNode = { id: 'g', type: 'group', position: { x: 0, y: 0 }, data: { label: 'G', nodeType: 'group', techStack: [] } };
    expect(computePathLatency([...nodes, group], [edge('g', 'api', '10 ms'), edge('api', 'api', '10 ms')]).size).toBe(0);
  });
});
