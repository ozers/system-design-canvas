import LZString from 'lz-string';
import { SharedCanvasSchema, type SystemNode, type SystemEdge } from '@/types';

export const SHARED_PATH = '/canvas/shared';

/** Path of a share link for an encoded payload. The payload is in the fragment, which browsers never send to the server. */
export function sharedPath(encoded: string): string {
  return `${SHARED_PATH}#d=${encoded}`;
}

export function encodeCanvasToUrl(nodes: SystemNode[], edges: SystemEdge[]): string {
  const payload = JSON.stringify({ n: nodes, e: edges });
  const compressed = LZString.compressToEncodedURIComponent(payload);
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}${sharedPath(compressed)}`;
}

/** Value of `d` in a `?a=b&d=…` or `#d=…` string, or null. Percent-escapes (added by some chat apps) are undone. */
function readD(part: string): string | null {
  const match = /(?:^|[?#&])d=([^&#]*)/.exec(part);
  if (!match || !match[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Find the share payload in a URL's `search` and `hash`.
 * Current links carry it in the fragment (`#d=…`). Links made before that put it in the
 * query (`?d=…`), which reaches the server; they still open and are flagged `legacy` so the
 * page can rewrite the address bar to the fragment form.
 */
export function readSharePayload(search: string, hash: string): { encoded: string; legacy: boolean } | null {
  const fromHash = readD(hash);
  if (fromHash) return { encoded: fromHash, legacy: false };
  const fromQuery = readD(search);
  if (fromQuery) return { encoded: fromQuery, legacy: true };
  return null;
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
