'use client';

import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { SYSTEM_NODE_TYPES, type SystemNodeType, type SystemNodeData, type SystemNode } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Download, ImageIcon, FileCode, Grid3x3, StickyNote } from 'lucide-react';
import { exportToPng, exportToSvg } from '@/lib/export';

let nodeCounter = 0;

export function CanvasToolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const addNode = useCanvasStore((s) => s.addNode);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const historyIndex = useCanvasStore((s) => s.historyIndex);
  const historyLength = useCanvasStore((s) => s.history.length);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const toggleSnapToGrid = useCanvasStore((s) => s.toggleSnapToGrid);

  const handleAddNode = (nodeType: SystemNodeType) => {
    nodeCounter++;
    const offset = (nodeCounter % 10) * 30;
    const config = NODE_REGISTRY[nodeType];
    const data: SystemNodeData = {
      label: config.label,
      nodeType,
      description: '',
      techStack: [...config.defaultTechStack],
    };
    addNode({
      id: `node-${Date.now()}-${nodeCounter}`,
      type: 'system',
      position: { x: 250 + offset, y: 150 + offset },
      data,
    });
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
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-1 shadow-lg">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Node
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SYSTEM_NODE_TYPES.map((type) => {
            const config = NODE_REGISTRY[type];
            const Icon = config.icon;
            return (
              <DropdownMenuItem key={type} onClick={() => handleAddNode(type)}>
                <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                {config.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" onClick={handleAddNote}>
        <StickyNote className="h-4 w-4 mr-1" />
        Note
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fitView()}>
        <Maximize className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${snapToGrid ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}`}
        onClick={toggleSnapToGrid}
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={undo}
        disabled={historyIndex <= 0}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={redo}
        disabled={historyIndex >= historyLength - 1}
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => exportToPng()}>
            <ImageIcon className="h-4 w-4 mr-2" />
            PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportToSvg()}>
            <FileCode className="h-4 w-4 mr-2" />
            SVG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
