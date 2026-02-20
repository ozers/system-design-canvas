'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { NODE_REGISTRY } from './node-registry';
import { SYSTEM_NODE_TYPES, type SystemNodeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2 } from 'lucide-react';

export function NodeEditor() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const [techInput, setTechInput] = useState('');

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node || !selectedNodeId) return null;

  const config = NODE_REGISTRY[node.data.nodeType];
  const Icon = config.icon;

  const handleTypeChange = (nodeType: SystemNodeType) => {
    const newConfig = NODE_REGISTRY[nodeType];
    updateNodeData(selectedNodeId, {
      nodeType,
      techStack: node.data.techStack.length === 0 ? [...newConfig.defaultTechStack] : node.data.techStack,
    });
  };

  const addTech = () => {
    if (!techInput.trim()) return;
    updateNodeData(selectedNodeId, {
      techStack: [...node.data.techStack, techInput.trim()],
    });
    setTechInput('');
  };

  const removeTech = (index: number) => {
    updateNodeData(selectedNodeId, {
      techStack: node.data.techStack.filter((_, i) => i !== index),
    });
  };

  const handleDelete = () => {
    deleteNode(selectedNodeId);
    setSelectedNodeId(null);
  };

  return (
    <div className="h-full w-80 shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="font-medium text-sm">{config.label}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSelectedNodeId(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={node.data.label}
            onChange={(e) => updateNodeData(selectedNodeId, { label: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-1">
            {SYSTEM_NODE_TYPES.map((type) => {
              const c = NODE_REGISTRY[type];
              const TypeIcon = c.icon;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors ${
                    node.data.nodeType === type
                      ? `${c.bgColor} ${c.borderColor} border font-medium`
                      : 'hover:bg-accent'
                  }`}
                >
                  <TypeIcon className={`h-3.5 w-3.5 ${c.color}`} />
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
            value={node.data.description ?? ''}
            onChange={(e) => updateNodeData(selectedNodeId, { description: e.target.value })}
            placeholder="What does this component do?"
          />
        </div>

        <div className="space-y-2">
          <Label>Tech Stack</Label>
          <div className="flex flex-wrap gap-1.5">
            {node.data.techStack.map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                {tech}
                <button onClick={() => removeTech(i)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTech()}
              placeholder="Add technology..."
              className="text-sm"
            />
            <Button variant="outline" size="icon" className="shrink-0" onClick={addTech}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}
