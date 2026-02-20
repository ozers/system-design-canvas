'use client';

import { useReactFlow, useStore } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { NODE_REGISTRY, getNodesByCategory } from '@/components/nodes/node-registry';
import type { SystemNodeType, SystemNodeData, SystemNode } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Download, Upload, ImageIcon, FileCode, FileJson, Grid3x3, StickyNote, LayoutDashboard } from 'lucide-react';
import { exportToPng, exportToSvg, exportToJson, importFromJson } from '@/lib/export';
import { getLayoutedElements } from '@/lib/auto-layout';

let nodeCounter = 0;

export function CanvasToolbar() {
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  const addNode = useCanvasStore((s) => s.addNode);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const historyIndex = useCanvasStore((s) => s.historyIndex);
  const historyLength = useCanvasStore((s) => s.history.length);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const toggleSnapToGrid = useCanvasStore((s) => s.toggleSnapToGrid);

  const undoCount = historyIndex;
  const redoCount = historyLength - 1 - historyIndex;

  const handleAddNode = (nodeType: SystemNodeType) => {
    nodeCounter++;
    const offset = (nodeCounter % 10) * 30;
    const config = NODE_REGISTRY[nodeType];
    const isGroup = nodeType === 'group';
    const data: SystemNodeData = {
      label: isGroup ? '' : config.label,
      nodeType,
      description: '',
      techStack: [...config.defaultTechStack],
    };
    addNode({
      id: `node-${Date.now()}-${nodeCounter}`,
      type: isGroup ? 'group' : 'system',
      position: { x: 250 + offset, y: 150 + offset },
      ...(isGroup ? { style: { width: 300, height: 200 } } : {}),
      data,
    });
  };

  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    pushHistory();
    const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
  };

  const handleImportJson = async () => {
    try {
      const { nodes: importedNodes, edges: importedEdges } = await importFromJson();
      pushHistory();
      setNodes(importedNodes);
      setEdges(importedEdges);
      requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
    } catch {
      // User cancelled or invalid file — silently ignore
    }
  };

  const handleAddNote = () => {
    nodeCounter++;
    const offset = (nodeCounter % 10) * 30;
    addNode({
      id: `note-${Date.now()}-${nodeCounter}`,
      type: 'note',
      position: { x: 300 + offset, y: 200 + offset },
      data: {
        label: '',
        nodeType: 'service',
        description: '',
        techStack: [],
      },
    } as SystemNode);
  };

  return (
    <TooltipProvider>
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-lg" role="toolbar" aria-label="Canvas toolbar">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Add Node">
                  <Plus className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Add Node</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className="md:hidden">Add Node</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            {getNodesByCategory().map(({ category, types }) => (
              <DropdownMenuSub key={category}>
                <DropdownMenuSubTrigger>{category}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {types.map(({ type, config }) => {
                    const Icon = config.icon;
                    return (
                      <DropdownMenuItem key={type} onClick={() => handleAddNode(type)}>
                        <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                        {config.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={handleAddNote} aria-label="Add Note">
              <StickyNote className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Note</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="md:hidden">Note</TooltipContent>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fitView()} aria-label="Fit view">
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit View</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="px-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={() => zoomTo(1)}
              aria-label="Reset zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
          </TooltipTrigger>
          <TooltipContent>Reset to 100%</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${snapToGrid ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={toggleSnapToGrid}
              aria-label="Toggle grid snap"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Grid Snap</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleAutoLayout}
              disabled={nodes.length === 0}
              aria-label="Auto layout"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Auto Layout</TooltipContent>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={undo}
              disabled={historyIndex <= 0}
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" />
              {undoCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                  {undoCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={redo}
              disabled={historyIndex >= historyLength - 1}
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" />
              {redoCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                  {redoCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-border" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Export">
                  <Download className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className="md:hidden">Export</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportToPng()}>
              <ImageIcon className="h-4 w-4 mr-2" />
              PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToSvg()}>
              <FileCode className="h-4 w-4 mr-2" />
              SVG
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportToJson(nodes, edges)}>
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImportJson} aria-label="Import JSON">
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import JSON</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
