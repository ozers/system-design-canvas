import LZString from 'lz-string';
import type { SystemNode, SystemEdge } from '@/types';

export function encodeCanvasToUrl(nodes: SystemNode[], edges: SystemEdge[]): string {
  const payload = JSON.stringify({ n: nodes, e: edges });
  const compressed = LZString.compressToEncodedURIComponent(payload);
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/canvas/shared?d=${compressed}`;
}

export function decodeCanvasFromUrl(encoded: string): { nodes: SystemNode[]; edges: SystemEdge[] } | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (!decompressed) return null;
    const data = JSON.parse(decompressed);
    if (!Array.isArray(data.n) || !Array.isArray(data.e)) return null;
    return { nodes: data.n, edges: data.e };
  } catch {
    return null;
  }
}
