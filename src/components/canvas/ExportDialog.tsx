'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from '@/stores/useToastStore';
import {
  copyPngToClipboard,
  exportFilename,
  exportToJson,
  exportToPng,
  exportToSvg,
  getImageSize,
  getJsonExport,
  renderCanvasImage,
} from '@/lib/export';
import { exportToMermaid } from '@/lib/mermaid';
import { downloadFile } from '@/lib/utils';

type ExportFormat = 'png' | 'svg' | 'json' | 'mermaid';
type Scale = '1' | '2' | '3';

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' },
  { value: 'json', label: 'JSON' },
  { value: 'mermaid', label: 'Mermaid' },
];

const SCALE_OPTIONS: { value: Scale; label: string }[] = [
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
  { value: '3', label: '3×' },
];

/** Transparent-background preview: CSS checkerboard. */
const CHECKERBOARD: React.CSSProperties = {
  backgroundColor: 'var(--paper)',
  backgroundImage:
    'conic-gradient(var(--line-2) 25%, transparent 0 50%, var(--line-2) 0 75%, transparent 0)',
  backgroundSize: '16px 16px',
};

export function ExportDialog() {
  const open = useCanvasStore((s) => s.exportOpen);
  const setOpen = useCanvasStore((s) => s.setExportOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[520px]" aria-describedby={undefined}>
        {/* Mounted only while open: preview and options reset each time. */}
        <ExportBody onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ExportBody({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<Scale>('2');
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ url: string | null } | null>(null);
  const [baseSize] = useState(() => getImageSize(1));

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const projectId = useCanvasStore((s) => s.projectId);
  const projectName = useProjectStore((s) => s.projects.find((p) => p.id === projectId)?.name);
  const filename = exportFilename(projectName);

  const isImage = format === 'png' || format === 'svg';
  const empty = nodes.length === 0;

  // Render the preview once, the first time an image tab is shown (after the dialog animates in).
  useEffect(() => {
    if (!isImage || preview || empty) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      renderCanvasImage({ format: 'png', scale: 1, transparent: true })
        .then((url) => !cancelled && setPreview({ url }))
        .catch(() => !cancelled && setPreview({ url: null }));
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isImage, preview, empty]);

  const text = useMemo(() => {
    if (format === 'json') return getJsonExport(nodes, edges);
    if (format === 'mermaid') return exportToMermaid(nodes, edges);
    return '';
  }, [format, nodes, edges]);

  const run = async (task: () => Promise<void> | void) => {
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };

  const downloadImage = () =>
    run(async () => {
      const opts = { scale: Number(scale), transparent };
      try {
        if (format === 'png') await exportToPng(filename, opts);
        else await exportToSvg(filename, opts);
      } catch {
        toast({ message: 'Export failed', tone: 'danger' });
        return;
      }
      toast({ message: `Exported ${filename}.${format}`, icon: Download });
      onClose();
    });

  const copyImage = () =>
    run(async () => {
      try {
        await copyPngToClipboard({ scale: Number(scale), transparent });
        toast({ message: 'Image copied', tone: 'ok' });
      } catch {
        toast({ message: "Couldn't copy image", tone: 'danger' });
      }
    });

  const downloadText = () => {
    if (format === 'json') {
      exportToJson(nodes, edges, filename);
      toast({ message: `Exported ${filename}.json`, icon: Download });
    } else {
      downloadFile(`${filename}.mmd`, new Blob([text], { type: 'text/plain' }));
      toast({ message: `Exported ${filename}.mmd`, icon: Download });
    }
  };

  const copyText = async () => {
    const label = format === 'json' ? 'JSON' : 'Mermaid';
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: `Copied ${label}`, tone: 'ok' });
    } catch {
      toast({ message: `Couldn't copy ${label}`, tone: 'danger' });
    }
  };

  const sizeHint = baseSize
    ? `${baseSize.width * Number(scale)}×${baseSize.height * Number(scale)} px`
    : '';

  return (
    <>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-line-2 px-[18px] pt-3.5 pb-3">
        <DialogTitle className="flex-1 text-[15px]">Export</DialogTitle>
        <Segmented
          size="sm"
          aria-label="Export format"
          value={format}
          onValueChange={setFormat}
          options={FORMAT_OPTIONS}
        />
        <DialogCloseButton />
      </div>

      {isImage ? (
        <div className="grid min-h-0 gap-3.5 overflow-y-auto px-[18px] py-4">
          <div
            className={
              transparent
                ? 'relative flex h-[220px] items-center justify-center overflow-hidden rounded-[12px] border border-line p-4'
                : 'dot-grid relative flex h-[220px] items-center justify-center overflow-hidden rounded-[12px] border border-line p-4'
            }
            style={transparent ? CHECKERBOARD : undefined}
          >
            {empty ? (
              <span className="text-[12.5px] text-ink-3">Add a component to export an image.</span>
            ) : !preview ? (
              <span className="text-[12.5px] text-ink-3">Rendering preview…</span>
            ) : preview.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL preview
              <img src={preview.url} alt="Export preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-[12.5px] text-ink-3">Preview unavailable</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {format === 'png' && (
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] text-ink-2">Scale</span>
                <Segmented size="sm" aria-label="Scale" value={scale} onValueChange={setScale} options={SCALE_OPTIONS} />
              </div>
            )}
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-2">
              Transparent background
              <Switch checked={transparent} onCheckedChange={setTransparent} aria-label="Transparent background" />
            </label>
          </div>
        </div>
      ) : (
        <pre className="m-0 max-h-[360px] min-h-0 flex-1 overflow-auto bg-bg px-[18px] py-3.5 font-mono text-[12px] leading-[1.6] text-ink-2 [tab-size:2]">
          {text}
        </pre>
      )}

      <div className="flex shrink-0 items-center gap-1.5 border-t border-line-2 px-[18px] pt-2.5 pb-3.5">
        <span className={format === 'png' ? 'font-mono text-[11.5px] text-ink-3' : 'text-[11.5px] text-ink-3'}>
          {format === 'png' && sizeHint}
          {format === 'svg' && 'Vector, editable'}
          {format === 'json' && 'Re-importable project'}
          {format === 'mermaid' && 'Renders in GitHub, Notion, Obsidian'}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {isImage ? (
            <>
              {format === 'png' && (
                <Button variant="secondary" onClick={copyImage} disabled={busy || empty}>
                  <Copy />
                  Copy
                </Button>
              )}
              <Button variant="primary" onClick={downloadImage} disabled={busy || empty}>
                <Download />
                {busy ? 'Exporting…' : `Download .${format}`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={downloadText}>
                <Download />
                {format === 'json' ? '.json' : '.mmd'}
              </Button>
              <Button variant="primary" onClick={copyText}>
                <Copy />
                Copy
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
