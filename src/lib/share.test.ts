import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { decodeCanvasFromUrl, encodeCanvasToUrl } from './share';
import type { SystemEdge, SystemNode } from '@/types';

const nodes: SystemNode[] = [
  { id: 'a', type: 'system', position: { x: 0, y: 0 }, data: { label: 'API', nodeType: 'service', techStack: ['Node'] } },
  { id: 'b', type: 'system', position: { x: 0, y: 100 }, data: { label: 'DB', nodeType: 'database', techStack: [] } },
  { id: 'n', type: 'note', position: { x: 200, y: 0 }, data: { label: 'hi', nodeType: 'service', techStack: [] } },
];
const edges: SystemEdge[] = [
  { id: 'e1', source: 'a', target: 'b', type: 'system', data: { edgeType: 'db-query' } },
];

function encode(payload: unknown): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

describe('decodeCanvasFromUrl', () => {
  it('round-trips a valid canvas', () => {
    const url = encodeCanvasToUrl(nodes, edges);
    const d = new URL(url, 'http://x').searchParams.get('d')!;
    const result = decodeCanvasFromUrl(d);
    expect(result).toEqual({ ok: true, nodes, edges });
  });

  it('keeps extra React Flow fields such as style and parentId', () => {
    const group = { id: 'g', type: 'group', position: { x: 0, y: 0 }, style: { width: 320 }, data: { label: 'G', nodeType: 'group', techStack: [] } };
    const child = { ...nodes[0], parentId: 'g' };
    const result = decodeCanvasFromUrl(encode({ n: [group, child], e: [] }));
    expect(result.ok && result.nodes[0].style).toEqual({ width: 320 });
    expect(result.ok && result.nodes[1].parentId).toBe('g');
  });

  it('fills a missing techStack with an empty list', () => {
    const data: Partial<SystemNode['data']> = { ...nodes[0].data };
    delete data.techStack;
    const result = decodeCanvasFromUrl(encode({ n: [{ ...nodes[0], data }], e: [] }));
    expect(result.ok && result.nodes[0].data.techStack).toEqual([]);
  });

  it('rejects text that is not a compressed payload', () => {
    expect(decodeCanvasFromUrl('garbage')).toEqual({ ok: false, error: 'unreadable' });
  });

  it('rejects a truncated link as unreadable', () => {
    const d = encode({ n: nodes, e: edges });
    expect(decodeCanvasFromUrl(d.slice(0, d.length / 2))).toEqual({ ok: false, error: 'unreadable' });
  });

  it.each([
    ['missing arrays', { n: nodes }],
    ['node without data', { n: [{ id: 'a', position: { x: 0, y: 0 } }], e: [] }],
    ['unknown node type', { n: [{ ...nodes[0], data: { ...nodes[0].data, nodeType: 'mainframe' } }], e: [] }],
    ['non-string tech stack', { n: [{ ...nodes[0], data: { ...nodes[0].data, techStack: [1] } }], e: [] }],
    ['node without position', { n: [{ id: 'a', data: nodes[0].data }], e: [] }],
    ['unknown edge type', { n: nodes, e: [{ ...edges[0], data: { edgeType: 'smoke-signal' } }] }],
    ['edge to a missing node', { n: nodes, e: [{ ...edges[0], target: 'zzz' }] }],
    ['duplicate node ids', { n: [nodes[0], nodes[0]], e: [] }],
  ])('rejects %s as invalid', (_, payload) => {
    expect(decodeCanvasFromUrl(encode(payload))).toEqual({ ok: false, error: 'invalid' });
  });
});
