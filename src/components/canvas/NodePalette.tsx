'use client';

import { useState, type DragEvent } from 'react';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { SYSTEM_NODE_TYPES, type SystemNodeType } from '@/types';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function NodePalette() {
  const [collapsed, setCollapsed] = useState(false);

  const onDragStart = (event: DragEvent, nodeType: SystemNodeType) => {
    event.dataTransfer.setData('application/reactflow-nodetype', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (collapsed) {
    return (
      <div className="absolute left-4 top-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-white dark:bg-gray-900 shadow-lg"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-4 z-10 w-48 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Components
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCollapsed(true)}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-1">
        {SYSTEM_NODE_TYPES.map((type) => {
          const config = NODE_REGISTRY[type];
          const Icon = config.icon;
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:cursor-grabbing"
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
