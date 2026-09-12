'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchInput } from '@/components/ui/input';
import { Kbd, KbdCombo } from '@/components/ui/kbd';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { SHORTCUT_GROUPS } from '@/lib/shortcuts';

export function ShortcutsDialog() {
  const open = useCanvasStore((s) => s.shortcutsOpen);
  const setOpen = useCanvasStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[760px]" aria-describedby={undefined}>
        <ShortcutsBody />
      </DialogContent>
    </Dialog>
  );
}

function ShortcutsBody() {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHORTCUT_GROUPS;
    return SHORTCUT_GROUPS.map((group) => ({
      ...group,
      items: group.name.toLowerCase().includes(q)
        ? group.items
        : group.items.filter(
            (item) =>
              item.label.toLowerCase().includes(q) ||
              item.keys.some((key) => key.toLowerCase() === q)
          ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-line-2 py-3.5 pr-4 pl-5">
        <DialogTitle className="text-[15px] leading-6">Keyboard shortcuts</DialogTitle>
        <SearchInput
          variant="inset"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shortcuts"
          aria-label="Search shortcuts"
          containerClassName="ml-auto w-[220px] max-w-[45%]"
        />
        <DialogCloseButton />
      </div>

      <div className="min-h-0 overflow-y-auto px-5 pt-2 pb-4">
        {groups.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-3">No shortcuts for “{query.trim()}”</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-8">
            {groups.map((group) => (
              <div key={group.name} className="pt-3">
                <div className="py-1.5 text-[11.5px] font-medium text-ink-3">{group.name}</div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex h-[34px] items-center justify-between gap-3 border-b border-line-2 text-[13px]"
                  >
                    <span className="truncate">{item.label}</span>
                    <KbdCombo keys={item.keys} className="shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line-2 bg-bg px-5 py-2.5 text-[12px] text-ink-3">
        Press
        <Kbd className="h-5 min-w-[18px] rounded-[5px] px-[5px] text-[11px]">?</Kbd>
        anywhere to open this.
      </div>
    </>
  );
}
