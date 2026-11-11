import LZString from 'lz-string';
import { SharedCanvasSchema, type SystemNode, type SystemEdge } from '@/types';

export function encodeCanvasToUrl(nodes: SystemNode[], edges: SystemEdge[]): string {
  const payload = JSON.stringify({ n: nodes, e: edges });
  const compressed = LZString.compressToEncodedURIComponent(payload);
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/canvas/shared?d=${compressed}`;
}

/** Share links above this size may be truncated by chat apps and some browsers. */
const SHARE_URL_WARN_BYTES = 8 * 1024;

/** Byte length of a share URL (UTF-8). */
export function getShareStats(url: string): { bytes: number; tooLong: boolean } {
  const bytes = new TextEncoder().encode(url).length;
  return { bytes, tooLong: bytes > SHARE_URL_WARN_BYTES };
}

/**
 * Why a share link was rejected:
 * - `unreadable`: not decompressible JSON (usually cut off when pasted);
 * - `invalid`: readable, but the nodes/edges don't match the canvas schema.
 */
type ShareDecodeError = 'unreadable' | 'invalid';

export type ShareDecodeResult =
  | { ok: true; nodes: SystemNode[]; edges: SystemEdge[] }
  | { ok: false; error: ShareDecodeError };

export function decodeCanvasFromUrl(encoded: string): ShareDecodeResult {
  let data: unknown;
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (!decompressed) return { ok: false, error: 'unreadable' };
    data = JSON.parse(decompressed);
  } catch {
    return { ok: false, error: 'unreadable' };
  }

  const result = SharedCanvasSchema.safeParse(data);
  if (!result.success) return { ok: false, error: 'invalid' };

  const nodes = result.data.n as SystemNode[];
  const edges = result.data.e as SystemEdge[];
  const ids = new Set(nodes.map((n) => n.id));
  if (ids.size !== nodes.length) return { ok: false, error: 'invalid' };
  if (edges.some((e) => !ids.has(e.source) || !ids.has(e.target))) return { ok: false, error: 'invalid' };
  return { ok: true, nodes, edges };
}
