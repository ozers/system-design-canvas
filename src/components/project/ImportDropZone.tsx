'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

function hasFiles(e: DragEvent) {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

/** Whole-page drop target: shows an overlay while files are dragged over the window. */
export function ImportDropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [active, setActive] = useState(false);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    let depth = 0;
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setActive(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) onFilesRef.current(files);
    };
    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      aria-live="polite"
      className="animate-fade-in pointer-events-none fixed inset-3 z-50 flex flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-accent bg-[color-mix(in_oklch,var(--accent-soft)_60%,var(--bg))] p-6 text-center"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-paper text-accent shadow-[var(--shadow)]">
        <Upload className="size-[18px]" />
      </span>
      <div className="grid gap-1">
        <div className="text-[15px] font-semibold">Drop to import</div>
        <div className="text-[13px] text-pretty text-ink-2">
          Accepts <span className="font-mono text-[12px]">.json</span> exported from System Design Canvas.
        </div>
      </div>
    </div>
  );
}
