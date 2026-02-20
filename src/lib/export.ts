import { toPng, toSvg } from 'html-to-image';
import type { SystemNode, SystemEdge } from '@/types';

function getFlowElement(): HTMLElement | null {
  return document.querySelector('.react-flow') as HTMLElement | null;
}

function getExportBgColor(): string {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? '#0a0a0a' : '#f9fafb';
}

export async function exportToPng(filename = 'system-design') {
  const el = getFlowElement();
  if (!el) return;

  const dataUrl = await toPng(el, {
    backgroundColor: getExportBgColor(),
    pixelRatio: 2,
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

export async function exportToSvg(filename = 'system-design') {
  const el = getFlowElement();
  if (!el) return;

  const dataUrl = await toSvg(el, {
    backgroundColor: getExportBgColor(),
  });

  const link = document.createElement('a');
  link.download = `${filename}.svg`;
  link.href = dataUrl;
  link.click();
}

export function exportToJson(
  nodes: SystemNode[],
  edges: SystemEdge[],
  filename = 'system-design'
) {
  const payload = { version: 1, nodes, edges };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
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
