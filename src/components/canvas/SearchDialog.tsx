'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { EDGE_REGISTRY } from '@/components/edges/edge-registry';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemNodeData, SystemEdgeData } from '@/types';

interface SearchResult {
  id: string;
  type: 'node' | 'edge';
  label: string;
  subtitle: string;
  icon?: React.ReactNode;
  color?: string;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);
  const { setCenter } = useReactFlow();

  const handleOpen = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    setOpen((prev) => !prev);
  }, []);

  // Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleOpen]);

  // Focus input when opened
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    prevOpen.current = open;
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show all nodes when empty
      return nodes
        .filter((n) => n.type === 'system')
        .map((n) => {
          const data = n.data as SystemNodeData;
          const config = NODE_REGISTRY[data.nodeType];
          const Icon = config.icon;
          return {
            id: n.id,
            type: 'node' as const,
            label: data.label,
            subtitle: [config.label, ...data.techStack].join(' · '),
            icon: <Icon className={cn('h-4 w-4', config.color)} />,
          };
        });
    }

    const nodeResults: SearchResult[] = nodes
      .filter((n) => {
        if (n.type !== 'system') return false;
        const data = n.data as SystemNodeData;
        return (
          data.label.toLowerCase().includes(q) ||
          data.nodeType.toLowerCase().includes(q) ||
          data.techStack.some((t) => t.toLowerCase().includes(q)) ||
          (data.description?.toLowerCase().includes(q)) ||
          (data.owner?.toLowerCase().includes(q))
        );
      })
      .map((n) => {
        const data = n.data as SystemNodeData;
        const config = NODE_REGISTRY[data.nodeType];
        const Icon = config.icon;
        return {
          id: n.id,
          type: 'node' as const,
          label: data.label,
          subtitle: [config.label, ...data.techStack].join(' · '),
          icon: <Icon className={cn('h-4 w-4', config.color)} />,
        };
      });

    const edgeResults: SearchResult[] = edges
      .filter((e) => {
        const data = e.data as SystemEdgeData | undefined;
        if (!data) return false;
        return (
          (data.label?.toLowerCase().includes(q)) ||
          data.edgeType.toLowerCase().includes(q) ||
          (data.description?.toLowerCase().includes(q)) ||
          (data.dataFormat?.toLowerCase().includes(q))
        );
      })
      .map((e) => {
        const data = e.data as SystemEdgeData;
        const config = EDGE_REGISTRY[data.edgeType];
        return {
          id: e.id,
          type: 'edge' as const,
          label: data.label || config.label,
          subtitle: [config.label, data.dataFormat, data.latency].filter(Boolean).join(' · '),
          color: config.color,
        };
      });

    return [...nodeResults, ...edgeResults];
  }, [query, nodes, edges]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  }, []);

  const selectResult = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      if (result.type === 'node') {
        const node = nodes.find((n) => n.id === result.id);
        if (node) {
          setSelectedNodeId(node.id);
          setCenter(node.position.x + 80, node.position.y + 40, { zoom: 1.5, duration: 300 });
        }
      } else {
        setSelectedEdgeId(result.id);
      }
    },
    [nodes, setSelectedNodeId, setSelectedEdgeId, setCenter]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          selectResult(results[selectedIndex]);
        }
      }
    },
    [results, selectedIndex, selectResult]
  );

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes, edges, tech stack..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found
            </p>
          )}
          {results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}`}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
                i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              )}
              onClick={() => selectResult(result)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {result.icon ? (
                result.icon
              ) : (
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: result.color }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{result.label}</div>
                {result.subtitle && (
                  <div className="truncate text-xs text-muted-foreground">{result.subtitle}</div>
                )}
              </div>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {result.type}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>
            <kbd className="rounded border border-border px-1 font-mono">↑↓</kbd> navigate
            <span className="mx-1.5">·</span>
            <kbd className="rounded border border-border px-1 font-mono">↵</kbd> select
          </span>
          <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

