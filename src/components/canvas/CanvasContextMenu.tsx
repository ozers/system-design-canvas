'use client';

import { useReactFlow } from '@xyflow/react';
import {
  AlignHorizontalJustifyCenter,
  BringToFront,
  ClipboardPaste,
  Copy,
  Lock,
  LockOpen,
  Maximize,
  MousePointerSquareDashed,
  Pencil,
  Plus,
  Sparkles,
  SquareDashed,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createNoteNode, createSystemNode } from '@/lib/node-factory';
import type { SystemNodeType } from '@/types';
import { AddComponentSubmenus } from './AddComponentMenu';
import { shortcutLabel } from './canvas-helpers';

export interface ContextMenuState {
  /** Client coordinates of the right-click. */
  x: number;
  y: number;
  nodeId?: string;
}

const DANGER_SHORTCUT = 'text-danger opacity-70';

export function CanvasContextMenu({ menu, onClose }: { menu: ContextMenuState; onClose: () => void }) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const nodes = useCanvasStore((s) => s.nodes);
  const hasClipboard = useCanvasStore((s) => (s.clipboard?.nodes.length ?? 0) > 0);

  const store = () => useCanvasStore.getState();
  const node = menu.nodeId ? nodes.find((n) => n.id === menu.nodeId) : undefined;
  const selected = nodes.filter((n) => n.selected);
  const isMulti = !!node?.selected && selected.length > 1;
  const selectedIds = selected.map((n) => n.id);

  const addAt = (kind: SystemNodeType | 'note') => {
    const p = screenToFlowPosition({ x: menu.x, y: menu.y });
    store().addNode(kind === 'note' ? createNoteNode(p) : createSystemNode(kind, p));
  };

  const renderNodeItems = () => {
    if (!node) return null;
    if (isMulti) {
      const locked = selected.every((n) => n.draggable === false);
      return (
        <>
          <DropdownMenuItem onSelect={() => store().duplicateNodes(selectedIds)}>
            <Copy />
            Duplicate {selected.length}
            <DropdownMenuShortcut>{shortcutLabel('duplicate')}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => store().groupSelection()}>
            <SquareDashed />
            Group
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => store().alignSelection()}>
            <AlignHorizontalJustifyCenter />
            Align
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => store().toggleLock(selectedIds)}>
            {locked ? <LockOpen /> : <Lock />}
            {locked ? 'Unlock' : 'Lock'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => store().deleteSelection()}>
            <Trash2 />
            Delete {selected.length}
            <DropdownMenuShortcut className={DANGER_SHORTCUT}>{shortcutLabel('delete')}</DropdownMenuShortcut>
          </DropdownMenuItem>
        </>
      );
    }

    const isComponent = node.type === 'system';
    const locked = node.draggable === false;
    return (
      <>
        {isComponent && (
          <DropdownMenuItem onSelect={() => store().setSelectedNodeId(node.id)}>
            <Pencil />
            Edit
            <DropdownMenuShortcut>⏎</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => store().duplicateNodes([node.id])}>
          <Copy />
          Duplicate
          <DropdownMenuShortcut>{shortcutLabel('duplicate')}</DropdownMenuShortcut>
        </DropdownMenuItem>
        {isComponent && (
          <DropdownMenuItem disabled className="h-auto py-1.5">
            <Sparkles className="text-accent" />
            <span className="grid leading-[1.25]">
              <span>Suggest next…</span>
              <span className="text-[11.5px] text-ink-3">Coming soon</span>
            </span>
            <span className="ml-auto rounded-full bg-accent-soft px-1.5 text-[10.5px] font-medium text-accent">AI</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => store().bringToFront(node.id)}>
          <BringToFront />
          Bring to front
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => store().toggleLock([node.id])}>
          {locked ? <LockOpen /> : <Lock />}
          {locked ? 'Unlock position' : 'Lock position'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => store().deleteNode(node.id)}>
          <Trash2 />
          Delete
          <DropdownMenuShortcut className={DANGER_SHORTCUT}>{shortcutLabel('delete')}</DropdownMenuShortcut>
        </DropdownMenuItem>
      </>
    );
  };

  const renderPaneItems = () => (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Plus />
          Add component
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-[200px]">
          <AddComponentSubmenus onAdd={addAt} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem onSelect={() => addAt('note')}>
        <StickyNote />
        Add note
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!hasClipboard} onSelect={() => store().pasteSelection()}>
        <ClipboardPaste />
        Paste
        <DropdownMenuShortcut>{shortcutLabel('paste')}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={nodes.length === 0} onSelect={() => store().selectAll()}>
        <MousePointerSquareDashed />
        Select all
        <DropdownMenuShortcut>{shortcutLabel('select-all')}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => fitView({ padding: 0.15, duration: 200 })}>
        <Maximize />
        Fit view
        <DropdownMenuShortcut>{shortcutLabel('fit-view')}</DropdownMenuShortcut>
      </DropdownMenuItem>
    </>
  );

  return (
    <DropdownMenu open modal={false} onOpenChange={(open) => !open && onClose()}>
      <DropdownMenuTrigger asChild>
        <span aria-hidden className="pointer-events-none fixed size-0" style={{ left: menu.x, top: menu.y }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        sideOffset={2}
        collisionPadding={8}
        className="w-[200px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {node ? renderNodeItems() : renderPaneItems()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
