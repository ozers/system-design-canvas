'use client';

import { useState, useEffect } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { EDGE_REGISTRY } from './edge-registry';
import { SYSTEM_EDGE_TYPES, type SystemEdgeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { X, Trash2, Clock, FileJson, Activity } from 'lucide-react';

function EdgeEditorContent() {
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const edges = useCanvasStore((s) => s.edges);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);

  const edge = edges.find((e) => e.id === selectedEdgeId);

  if (!edge || !selectedEdgeId || !edge.data) return null;

  const config = EDGE_REGISTRY[edge.data.edgeType];

  const handleTypeChange = (edgeType: SystemEdgeType) => {
    updateEdgeData(selectedEdgeId, { edgeType });
  };

  const handleDelete = () => {
    deleteEdge(selectedEdgeId);
    setSelectedEdgeId(null);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="font-medium text-sm">{config.label}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:flex hidden"
          onClick={() => setSelectedEdgeId(null)}
          aria-label="Close editor"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={edge.data.label ?? ''}
            onChange={(e) => updateEdgeData(selectedEdgeId, { label: e.target.value })}
            placeholder="Connection label..."
          />
        </div>

        <div className="space-y-2">
          <Label>Connection Type</Label>
          <div className="grid grid-cols-2 gap-1">
            {SYSTEM_EDGE_TYPES.map((type) => {
              const c = EDGE_REGISTRY[type];
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors ${
                    edge.data!.edgeType === type
                      ? 'bg-muted font-medium ring-1 ring-border'
                      : 'hover:bg-accent'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            rows={3}
            value={edge.data.description ?? ''}
            onChange={(e) => updateEdgeData(selectedEdgeId, { description: e.target.value })}
            placeholder="What does this connection do?"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Connection Details</Label>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Label className="text-xs shrink-0 w-16">Latency</Label>
              <Input
                value={edge.data.latency ?? ''}
                onChange={(e) => updateEdgeData(selectedEdgeId, { latency: e.target.value })}
                placeholder="e.g. <100ms, ~50ms"
                className="h-7 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <FileJson className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Label className="text-xs shrink-0 w-16">Format</Label>
              <Input
                value={edge.data.dataFormat ?? ''}
                onChange={(e) => updateEdgeData(selectedEdgeId, { dataFormat: e.target.value })}
                placeholder="e.g. JSON, Protobuf, XML"
                className="h-7 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Label className="text-xs shrink-0 w-16">Throughput</Label>
              <Input
                value={edge.data.throughput ?? ''}
                onChange={(e) => updateEdgeData(selectedEdgeId, { throughput: e.target.value })}
                placeholder="e.g. 1K req/s, 10MB/s"
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Connection
          </Button>
        </div>
      </div>
    </>
  );
}

export function EdgeEditor() {
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const edges = useCanvasStore((s) => s.edges);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const edge = edges.find((e) => e.id === selectedEdgeId);
  const isOpen = !!edge && !!selectedEdgeId;

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) setSelectedEdgeId(null); }}>
        <SheetContent side="right" showCloseButton>
          <SheetTitle className="sr-only">Edit Connection</SheetTitle>
          <EdgeEditorContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="h-full w-80 shrink-0 border-l border-border bg-card overflow-y-auto">
      <EdgeEditorContent />
    </div>
  );
}
