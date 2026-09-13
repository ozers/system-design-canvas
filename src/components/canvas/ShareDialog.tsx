'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ImageIcon, Info, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { toast } from '@/stores/useToastStore';
import { encodeCanvasToUrl, getShareStats } from '@/lib/share';
import { copyPngToClipboard } from '@/lib/export';
import { cn, formatBytes, plural } from '@/lib/utils';

const COPIED_MS = 1800;

export function ShareDialog() {
  const open = useCanvasStore((s) => s.shareOpen);
  const setOpen = useCanvasStore((s) => s.setShareOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader className="pb-3">
          <div className="min-w-0 flex-1">
            <DialogTitle>Share</DialogTitle>
            <DialogDescription>Anyone with the link gets an editable copy. No account needed.</DialogDescription>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        {/* Mounted only while open: the link is a snapshot taken when the dialog opens. */}
        <ShareBody />
      </DialogContent>
    </Dialog>
  );
}

function ShareBody() {
  // Snapshot on open — the link is not live.
  const [snapshot] = useState(() => {
    const { nodes, edges } = useCanvasStore.getState();
    const url = nodes.length > 0 ? encodeCanvasToUrl(nodes, edges) : '';
    return {
      url,
      nodeCount: nodes.filter((n) => n.type !== 'note' && n.type !== 'group').length,
      empty: nodes.length === 0,
      ...getShareStats(url),
    };
  });
  const [copied, setCopied] = useState(false);
  const [copyingImage, setCopyingImage] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(snapshot.url);
    } catch {
      toast({ message: "Couldn't copy link", tone: 'danger' });
      return;
    }
    setCopied(true);
    toast({ message: 'Link copied', tone: 'ok' });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const copyImage = async () => {
    setCopyingImage(true);
    try {
      await copyPngToClipboard({ scale: 2 });
      toast({ message: 'Image copied', tone: 'ok' });
    } catch {
      toast({ message: "Couldn't copy image", tone: 'danger' });
    } finally {
      setCopyingImage(false);
    }
  };

  const displayUrl = snapshot.url.replace(/^https?:\/\//, '');

  return (
    <DialogBody className="grid grid-cols-[minmax(0,1fr)] gap-3.5 pt-0">
      <div className="flex h-10 min-w-0 items-center gap-1.5 rounded-full border border-line bg-line-2 pr-1.5 pl-3">
        <Link className="size-3.5 shrink-0 text-ink-3" />
        {snapshot.empty ? (
          <span className="min-w-0 flex-1 truncate text-[12px] text-ink-3">Add a component first.</span>
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2" title={snapshot.url}>
            {displayUrl}
          </span>
        )}
        <button
          type="button"
          onClick={copyLink}
          disabled={snapshot.empty}
          className={cn(
            'inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium whitespace-nowrap outline-none transition-[background-color,color,box-shadow,opacity] duration-[120ms] focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] disabled:pointer-events-none disabled:opacity-50',
            copied ? 'bg-ok text-[oklch(0.15_0.03_150)]' : 'bg-ink text-paper hover:opacity-90'
          )}
        >
          {copied ? <Check className="size-[13px]" /> : <Copy className="size-[13px]" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-[10px] border border-line px-3 py-2.5">
          <div className="text-[11px] text-ink-3">Link size</div>
          <div className="truncate font-mono text-[13px] font-medium whitespace-nowrap">
            {snapshot.empty ? '—' : formatBytes(snapshot.bytes)}{' '}
            <span className="font-normal text-ink-3">· {plural(snapshot.nodeCount, 'node')}</span>
          </div>
        </div>
        <div className="min-w-0 rounded-[10px] border border-line px-3 py-2.5">
          <div className="text-[11px] text-ink-3">Snapshot</div>
          <div className="truncate text-[13px] font-medium whitespace-nowrap">
            Now <span className="font-normal text-ink-3">· not live</span>
          </div>
        </div>
      </div>

      {snapshot.tooLong && (
        <div className="flex items-start gap-2 rounded-[10px] bg-[color-mix(in_oklch,var(--warn)_12%,transparent)] px-3 py-2.5 text-[12px] leading-[1.45] text-ink-2">
          <Info className="mt-px size-3.5 shrink-0 text-warn" />
          <span>Links over ~8 KB may break in Slack and some browsers. Export JSON for large designs.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button variant="secondary" onClick={copyImage} disabled={snapshot.empty || copyingImage}>
          <ImageIcon />
          {copyingImage ? 'Copying…' : 'Copy as PNG'}
        </Button>
      </div>
    </DialogBody>
  );
}
