'use client';

import { useCanvasStore } from '@/stores/useCanvasStore';
import { EDGE_REGISTRY } from './edge-registry';
import { SYSTEM_EDGE_TYPES, type SystemEdgeType } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Settings2, Trash2 } from 'lucide-react';

interface EdgeTypeSelectorProps {
  edgeId: string;
  currentType: SystemEdgeType;
  currentLabel?: string;
}

export function EdgeTypeSelector({ edgeId, currentType, currentLabel }: EdgeTypeSelectorProps) {
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const [label, setLabel] = useState(currentLabel ?? '');
  const [open, setOpen] = useState(false);

  const handleTypeSelect = (edgeType: SystemEdgeType) => {
    updateEdgeData(edgeId, { edgeType });
  };

  const handleLabelChange = (value: string) => {
    setLabel(value);
    updateEdgeData(edgeId, { label: value });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="rounded p-0.5 hover:bg-accent transition-colors" aria-label="Edit connection type">
          <Settings2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="top">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Connection Type</Label>
            <div className="grid grid-cols-2 gap-1">
              {SYSTEM_EDGE_TYPES.map((type) => {
                const config = EDGE_REGISTRY[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
                      currentType === type
                        ? 'bg-muted font-medium ring-1 ring-border'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Connection label..."
              className="h-7 text-xs"
            />
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => {
              deleteEdge(edgeId);
              setOpen(false);
            }}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
