import { toPng, toSvg } from 'html-to-image';

function getFlowElement(): HTMLElement | null {
  return document.querySelector('.react-flow') as HTMLElement | null;
}

export async function exportToPng(filename = 'system-design') {
  const el = getFlowElement();
  if (!el) return;

  const dataUrl = await toPng(el, {
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#f9fafb',
  });

  const link = document.createElement('a');
  link.download = `${filename}.svg`;
  link.href = dataUrl;
  link.click();
}
