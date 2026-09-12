'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, TriangleAlert, Info } from 'lucide-react';
import { useToastStore, type Toast } from '@/stores/useToastStore';
import { cn } from '@/lib/utils';

const TONE_COLOR: Record<Toast['tone'], string> = {
  ok: 'text-ok',
  neutral: 'text-ink-2',
  danger: 'text-danger',
};

const TONE_ICON = { ok: Check, neutral: Info, danger: TriangleAlert };

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [hovered, setHovered] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);

  useEffect(() => {
    if (hovered) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [hovered, dismiss, toast.id]);

  const Icon = toast.icon ?? TONE_ICON[toast.tone];

  return (
    <div
      role="status"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="animate-toast-in pointer-events-auto flex h-10 max-w-[calc(100vw-48px)] items-center gap-2.5 rounded-full border border-line bg-paper pr-1.5 pl-3 text-[12.5px] whitespace-nowrap text-ink shadow-[var(--shadow-lg)]"
    >
      <Icon className={cn('size-3.5 shrink-0', TONE_COLOR[toast.tone])} />
      <span className="truncate font-medium">{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
          className="h-7 shrink-0 rounded-full bg-line-2 px-2.5 text-[12px] font-medium text-ink outline-none transition-colors hover:bg-line focus-visible:shadow-[0_0_0_2px_var(--accent-soft)]"
        >
          {toast.action.label}
        </button>
      ) : (
        <span className="w-1.5" />
      )}
    </div>
  );
}

/** Bottom-right toast stack (max 3). Mounted once in Providers. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-6 bottom-6 z-[60] flex flex-col items-end gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
