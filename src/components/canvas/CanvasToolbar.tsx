'use client';

import { useState, type ReactElement, type ReactNode } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';
import {
  Container,
  FileJson,
  LayoutDashboard,
  Lock,
  LockOpen,
  Minus,
  MoreHorizontal,
  MousePointerSquareDashed,
  Plus,
  Redo2,
  SquareDashed,
  StickyNote,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useIsNarrow } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/stores/useToastStore';
import { importFromJson } from '@/lib/export';
import { importDockerCompose } from '@/lib/docker-compose';
import { getLayoutedElements } from '@/lib/auto-layout';
import { getShortcutKeys } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';
import type { SystemEdge, SystemNode } from '@/types';
import { AddComponentSubmenus } from './AddComponentMenu';
import { getFitViewOptions, shortcutLabel, useAddNodeAtCenter } from './canvas-helpers';

const COARSE_HIT = '[@media(pointer:coarse)]:size-11';

function Divider() {
  return <div aria-hidden className="mx-1.5 h-[18px] w-px shrink-0 bg-line" />;
}

/** Icon button inside the pill. Disabled keeps its tooltip: opacity .35 + not-allowed. */
function ToolbarIconButton({
  label,
  keys,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  keys?: string[];
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SimpleTooltip label={label} keys={keys} side="top">
      <Button
        variant="icon"
        size="icon-toolbar"
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        className={cn(disabled && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-2', className)}
      >
        {children}
      </Button>
    </SimpleTooltip>
  );
}

function useToolbarActions() {
  const { fitView } = useReactFlow();

  const refit = () => requestAnimationFrame(() => fitView(getFitViewOptions(300)));

  const autoLayout = () => {
    const { nodes, edges, pushHistory, setNodes } = useCanvasStore.getState();
    if (nodes.length === 0) return;
    pushHistory();
    setNodes(getLayoutedElements(nodes, edges).nodes);
    refit();
  };

  const runImport = async (
    kind: string,
    read: () => Promise<{ nodes: SystemNode[]; edges: SystemEdge[] }>
  ) => {
    try {
      const imported = await read();
      const { pushHistory, setNodes, setEdges } = useCanvasStore.getState();
      pushHistory();
      setNodes(imported.nodes);
      setEdges(imported.edges);
      refit();
    } catch (err) {
      if (err instanceof Error && err.message === 'No file selected') return;
      const detail = err instanceof Error ? err.message : String(err);
      toast({
        message: `Couldn't read ${kind}`,
        tone: 'danger',
        action: { label: 'Details', onClick: () => toast({ message: detail, tone: 'danger' }) },
      });
    }
  };

  return {
    autoLayout,
    importJson: () => runImport('JSON', importFromJson),
    importCompose: () => runImport('docker-compose.yml', importDockerCompose),
  };
}

function MoreMenu({
  narrow,
  trigger,
  onAddNote,
  onAutoLayout,
  onImportJson,
  onImportCompose,
  onClear,
}: {
  narrow: boolean;
  trigger: ReactElement;
  onAddNote: () => void;
  onAutoLayout: () => void;
  onImportJson: () => void;
  onImportCompose: () => void;
  onClear: () => void;
}) {
  const hasNodes = useCanvasStore((s) => s.nodes.length > 0);
  const canUndo = useCanvasStore((s) => s.historyIndex > 0);
  const canRedo = useCanvasStore((s) => s.historyIndex < s.history.length - 1);
  const selectedCount = useCanvasStore((s) => s.nodes.reduce((n, node) => n + (node.selected ? 1 : 0), 0));
  const allLocked = useCanvasStore((s) => {
    const selected = s.nodes.filter((n) => n.selected);
    return selected.length > 0 && selected.every((n) => n.draggable === false);
  });

  const withStore = (fn: (s: ReturnType<typeof useCanvasStore.getState>) => void) => () => fn(useCanvasStore.getState());

  return (
    <DropdownMenu modal={false}>
      <SimpleTooltip label="More" side="top">
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      </SimpleTooltip>
      <DropdownMenuContent side={narrow ? 'bottom' : 'top'} align="end" sideOffset={10} className="w-[220px]">
        {narrow && (
          <>
            <DropdownMenuItem onSelect={onAddNote}>
              <StickyNote />
              Add note
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onAutoLayout} disabled={!hasNodes}>
              <LayoutDashboard />
              Auto layout
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={withStore((s) => s.undo())} disabled={!canUndo}>
              <Undo2 />
              Undo
              <DropdownMenuShortcut>{shortcutLabel('undo')}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={withStore((s) => s.redo())} disabled={!canRedo}>
              <Redo2 />
              Redo
              <DropdownMenuShortcut>{shortcutLabel('redo')}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={withStore((s) => s.selectAll())} disabled={!hasNodes}>
          <MousePointerSquareDashed />
          Select all
          <DropdownMenuShortcut>{shortcutLabel('select-all')}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={withStore((s) => s.groupSelection())} disabled={selectedCount === 0}>
          <SquareDashed />
          Group selection
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={withStore((s) => s.toggleLock(s.nodes.filter((n) => n.selected).map((n) => n.id)))}
          disabled={selectedCount === 0}
        >
          {allLocked ? <LockOpen /> : <Lock />}
          {allLocked ? 'Unlock selection' : 'Lock selection'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onImportJson}>
          <FileJson />
          Import JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onImportCompose}>
          <Container />
          Import docker-compose
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onClear} disabled={!hasNodes}>
          <Trash2 />
          Clear canvas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ClearCanvasDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Clear canvas?</DialogTitle>
        </DialogHeader>
        <DialogBody className="pt-1.5">
          <DialogDescription className="mt-0 text-[13px]">
            Removes every component and connection. You can undo this.
          </DialogDescription>
        </DialogBody>
        <DialogFooter className="justify-end border-t-0 pt-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger-solid"
            onClick={() => {
              clearCanvas();
              onOpenChange(false);
            }}
          >
            Clear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CanvasToolbar() {
  const narrow = useIsNarrow();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  const addAtCenter = useAddNodeAtCenter();
  const { autoLayout, importJson, importCompose } = useToolbarActions();
  const hasNodes = useCanvasStore((s) => s.nodes.length > 0);
  const canUndo = useCanvasStore((s) => s.historyIndex > 0);
  const canRedo = useCanvasStore((s) => s.historyIndex < s.history.length - 1);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const setLibraryCollapsed = useCanvasStore((s) => s.setLibraryCollapsed);
  const [clearOpen, setClearOpen] = useState(false);

  const zoomPct = `${Math.round(zoom * 100)}%`;
  const fit = () => fitView(getFitViewOptions(200));

  const moreProps = {
    narrow,
    onAddNote: () => addAtCenter('note'),
    onAutoLayout: autoLayout,
    onImportJson: importJson,
    onImportCompose: importCompose,
    onClear: () => setClearOpen(true),
  };

  if (narrow) {
    return (
      <>
        <div
          role="toolbar"
          aria-label="Canvas toolbar"
          className="absolute top-3 right-3 z-10 flex items-center gap-0.5 rounded-full border border-line bg-paper p-1 whitespace-nowrap shadow-[var(--shadow-lg)]"
        >
          <Button
            variant="toolbar"
            size="icon"
            aria-label="Add component"
            onClick={() => setLibraryCollapsed(false)}
            className={COARSE_HIT}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            aria-label="Fit view"
            onClick={fit}
            className="h-8 px-2 text-[12px] font-normal tabular-nums [@media(pointer:coarse)]:h-11"
          >
            {zoomPct}
          </Button>
          <MoreMenu
            {...moreProps}
            trigger={
              <Button variant="icon" aria-label="More" className={COARSE_HIT}>
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
        </div>
        <ClearCanvasDialog open={clearOpen} onOpenChange={setClearOpen} />
      </>
    );
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Canvas toolbar"
        className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-paper p-[5px] whitespace-nowrap shadow-[var(--shadow-lg)]"
      >
        <DropdownMenu>
          <SimpleTooltip label="Add component" side="top">
            <DropdownMenuTrigger asChild>
              <Button variant="toolbar" size="toolbar">
                <Plus />
                Add
              </Button>
            </DropdownMenuTrigger>
          </SimpleTooltip>
          <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-[200px]">
            <AddComponentSubmenus onAdd={addAtCenter} />
          </DropdownMenuContent>
        </DropdownMenu>
        <SimpleTooltip label="Add note" side="top">
          <Button variant="ghost" size="toolbar" onClick={() => addAtCenter('note')}>
            <StickyNote />
            Note
          </Button>
        </SimpleTooltip>

        <Divider />

        <ToolbarIconButton label="Zoom out" onClick={() => zoomOut({ duration: 150 })}>
          <Minus />
        </ToolbarIconButton>
        <SimpleTooltip label="Fit view" keys={getShortcutKeys('fit-view')} side="top">
          <Button
            variant="ghost"
            size="toolbar"
            onClick={fit}
            className="min-w-[46px] px-2 text-[12.5px] font-normal tabular-nums"
          >
            {zoomPct}
          </Button>
        </SimpleTooltip>
        <ToolbarIconButton label="Zoom in" onClick={() => zoomIn({ duration: 150 })}>
          <Plus />
        </ToolbarIconButton>

        <Divider />

        <ToolbarIconButton label="Auto layout" onClick={autoLayout} disabled={!hasNodes}>
          <LayoutDashboard />
        </ToolbarIconButton>
        <ToolbarIconButton label="Undo" keys={getShortcutKeys('undo')} onClick={undo} disabled={!canUndo}>
          <Undo2 />
        </ToolbarIconButton>
        <ToolbarIconButton label="Redo" keys={getShortcutKeys('redo')} onClick={redo} disabled={!canRedo}>
          <Redo2 />
        </ToolbarIconButton>
        <MoreMenu
          {...moreProps}
          trigger={
            <Button variant="icon" size="icon-toolbar" aria-label="More">
              <MoreHorizontal />
            </Button>
          }
        />
      </div>
      <ClearCanvasDialog open={clearOpen} onOpenChange={setClearOpen} />
    </>
  );
}
