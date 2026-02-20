'use client';

import { useState, useMemo, type DragEvent } from 'react';
import { getNodesByCategory } from '@/components/nodes/node-registry';
import type { SystemNodeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';

const allCategories = getNodesByCategory();

export function NodePalette() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return allCategories;
    const q = search.toLowerCase();
    return allCategories
      .map(({ category, types }) => ({
        category,
        types: types.filter(
          ({ config }) =>
            config.label.toLowerCase().includes(q) ||
            config.defaultTechStack.some((t) => t.toLowerCase().includes(q))
        ),
      }))
      .filter(({ types }) => types.length > 0);
  }, [search]);

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
          className="h-9 w-9 bg-card shadow-lg"
          onClick={() => setCollapsed(false)}
          aria-label="Open component palette"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-4 z-10 w-48 rounded-lg border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Components
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCollapsed(true)}
          aria-label="Close component palette"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="px-3 pt-1 pb-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-7 pl-7 pr-7 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-3 pb-3">
        {filteredCategories.length === 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">No results</p>
        )}
        {filteredCategories.map(({ category, types }) => (
          <div key={category} className="mt-2">
            <div className="mb-1 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {category}
            </div>
            <div className="space-y-0.5">
              {types.map(({ type, config }) => {
                const Icon = config.icon;
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => onDragStart(e, type)}
                    aria-label={`Drag to add ${config.label} node`}
                    className="flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent active:cursor-grabbing"
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-foreground">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
