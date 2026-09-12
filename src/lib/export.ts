import { toBlob, toPng, toSvg } from 'html-to-image';
import type { SystemNode, SystemEdge } from '@/types';
import { downloadFile } from '@/lib/utils';

export type ImageFormat = 'png' | 'svg';

export interface ImageExportOptions {
  /** Pixel ratio for raster output (PNG). Default 2. */
  scale?: number;
  /** Skip the --bg fill. Default false. */
  transparent?: boolean;
}

/** Padding around the diagram bounds, in flow px. */
const EXPORT_PADDING = 32;
/** Longest side of the exported image before scale, in px. */
const MAX_BASE_SIZE = 4096;

/** UI chrome that never belongs in an exported image. */
const CHROME_CLASSES = [
  'react-flow__minimap',
  'react-flow__panel',
  'react-flow__attribution',
  'react-flow__controls',
  'react-flow__selection',
  'react-flow__nodesselection',
];

function getFlowElement(): HTMLElement | null {
  return document.querySelector('.react-flow') as HTMLElement | null;
}

function getViewportElement(): HTMLElement | null {
  return document.querySelector('.react-flow__viewport') as HTMLElement | null;
}

/** Canvas ground color for the active theme (resolved --bg). */
function getExportBgColor(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (value) return value;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark ? 'oklch(0.19 0.006 60)' : 'oklch(0.985 0.003 80)';
}

function makeFilter(transparent: boolean) {
  return (domNode: HTMLElement) => {
    const classList = domNode.classList;
    if (!classList) return true;
    if (CHROME_CLASSES.some((c) => classList.contains(c))) return false;
    if (transparent && classList.contains('react-flow__background')) return false;
    return true;
  };
}

interface ExportFrame {
  /** Base image size (before scale), px. */
  width: number;
  height: number;
  /** Transform applied to .react-flow__viewport so the diagram fills the frame. */
  transform: string;
}

/**
 * Bounds of everything drawn on the canvas (nodes, edge paths, edge labels) in flow
 * coordinates, measured from the DOM so nested/group nodes and labels are included.
 */
function getExportFrame(viewport: HTMLElement): ExportFrame | null {
  const pane = viewport.parentElement;
  if (!pane) return null;
  const elements = viewport.querySelectorAll(
    '.react-flow__node, .react-flow__edge-path, .react-flow__edgelabel-renderer > *'
  );
  if (elements.length === 0) return null;

  const cssTransform = getComputedStyle(viewport).transform;
  const matrix = !cssTransform || cssTransform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(cssTransform);
  const zoom = matrix.a || 1;
  const origin = pane.getBoundingClientRect();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    const x1 = (rect.left - origin.left - matrix.e) / zoom;
    const y1 = (rect.top - origin.top - matrix.f) / zoom;
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x1 + rect.width / zoom);
    maxY = Math.max(maxY, y1 + rect.height / zoom);
  });
  if (!Number.isFinite(minX)) return null;

  const rawWidth = maxX - minX + EXPORT_PADDING * 2;
  const rawHeight = maxY - minY + EXPORT_PADDING * 2;
  const fit = Math.min(1, MAX_BASE_SIZE / Math.max(rawWidth, rawHeight));
  const tx = (EXPORT_PADDING - minX) * fit;
  const ty = (EXPORT_PADDING - minY) * fit;

  return {
    width: Math.ceil(rawWidth * fit),
    height: Math.ceil(rawHeight * fit),
    transform: `translate(${tx}px, ${ty}px) scale(${fit})`,
  };
}

type HtmlToImageOptions = NonNullable<Parameters<typeof toPng>[1]>;

/** Target element + html-to-image options for the current canvas. */
function getRenderTarget({ scale = 2, transparent = false }: ImageExportOptions) {
  const backgroundColor = transparent ? undefined : getExportBgColor();
  const filter = makeFilter(transparent);
  const viewport = getViewportElement();
  const frame = viewport ? getExportFrame(viewport) : null;

  if (viewport && frame) {
    const options: HtmlToImageOptions = {
      width: frame.width,
      height: frame.height,
      pixelRatio: scale,
      backgroundColor,
      filter,
      style: { width: `${frame.width}px`, height: `${frame.height}px`, transform: frame.transform },
    };
    return { el: viewport, options };
  }

  // Empty or unmeasured canvas: fall back to the whole flow element.
  const el = getFlowElement();
  if (!el) return null;
  const options: HtmlToImageOptions = { pixelRatio: scale, backgroundColor, filter };
  return { el, options };
}

/** Size in px of the image an export at `scale` would produce, or null without a canvas. */
export function getImageSize(scale = 1): { width: number; height: number } | null {
  if (typeof document === 'undefined') return null;
  const viewport = getViewportElement();
  const frame = viewport ? getExportFrame(viewport) : null;
  if (frame) return { width: Math.round(frame.width * scale), height: Math.round(frame.height * scale) };
  const el = getFlowElement();
  if (!el) return null;
  return { width: Math.round(el.clientWidth * scale), height: Math.round(el.clientHeight * scale) };
}

/** Render the diagram (UI chrome excluded) to a PNG or SVG data URL. */
export async function renderCanvasImage({
  format,
  scale = 2,
  transparent = false,
}: ImageExportOptions & { format: ImageFormat }): Promise<string> {
  const target = getRenderTarget({ scale, transparent });
  if (!target) throw new Error('Canvas not found');
  return format === 'png' ? toPng(target.el, target.options) : toSvg(target.el, target.options);
}

export async function exportToPng(filename = 'system-design', opts: ImageExportOptions = {}) {
  const dataUrl = await renderCanvasImage({ format: 'png', ...opts });
  downloadFile(`${filename}.png`, dataUrl);
}

export async function exportToSvg(filename = 'system-design', opts: ImageExportOptions = {}) {
  const dataUrl = await renderCanvasImage({ format: 'svg', ...opts });
  downloadFile(`${filename}.svg`, dataUrl);
}

/** Put a PNG of the diagram on the clipboard. Rejects when the browser can't. */
export async function copyPngToClipboard(opts: ImageExportOptions = {}) {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Image clipboard not supported');
  }
  // The blob promise goes straight into ClipboardItem so Safari keeps the user gesture.
  const blob = (async () => {
    const target = getRenderTarget(opts);
    if (!target) throw new Error('Canvas not found');
    const result = await toBlob(target.el, target.options);
    if (!result) throw new Error('Render failed');
    return result;
  })();
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

/** File-name-safe slug of a project name, or "system-design". */
export function exportFilename(name?: string | null) {
  const slug = (name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'system-design';
}

/** Re-importable project JSON, as written by exportToJson. */
export function getJsonExport(nodes: SystemNode[], edges: SystemEdge[]) {
  return JSON.stringify({ version: 1, nodes, edges }, null, 2);
}

export function exportToJson(
  nodes: SystemNode[],
  edges: SystemEdge[],
  filename = 'system-design'
) {
  const blob = new Blob([getJsonExport(nodes, edges)], { type: 'application/json' });
  downloadFile(`${filename}.json`, blob);
}

export function importFromJson(): Promise<{ nodes: SystemNode[]; edges: SystemEdge[] }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
            throw new Error('Invalid format: expected { nodes, edges }');
          }
          resolve({ nodes: data.nodes, edges: data.edges });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
