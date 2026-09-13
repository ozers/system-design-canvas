'use client';

import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description: ReactNode;
  /** Right-aligned buttons, e.g. Cancel (ghost) + confirm (danger-solid). */
  actions: ReactNode;
}

/** Compact 320px confirmation card. */
export function ConfirmDialog({ open, onClose, title, description, actions }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-[320px] rounded-[14px]">
        <div className="grid gap-3.5 px-[18px] pt-[18px] pb-3.5">
          <div className="grid gap-1">
            <DialogTitle className="text-[15px] leading-[1.3] break-words">{title}</DialogTitle>
            <DialogDescription className="mt-0 text-[13px] text-pretty">{description}</DialogDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">{actions}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
