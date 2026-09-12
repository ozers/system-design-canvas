import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';

export type ToastTone = 'ok' | 'neutral' | 'danger';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  icon?: LucideIcon;
  action?: ToastAction;
  /** Auto-dismiss delay in ms (default 3000). Paused while hovered. */
  duration: number;
}

export type ToastInput = Omit<Toast, 'id' | 'tone' | 'duration'> & {
  tone?: ToastTone;
  duration?: number;
};

const MAX_TOASTS = 3;

interface ToastStore {
  toasts: Toast[];
  show: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (input) => {
    const id = crypto.randomUUID();
    const toast: Toast = { tone: 'neutral', duration: 3000, ...input, id };
    set((state) => ({ toasts: [...state.toasts, toast].slice(-MAX_TOASTS) }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable outside React components. */
export function toast(input: ToastInput): string {
  return useToastStore.getState().show(input);
}
