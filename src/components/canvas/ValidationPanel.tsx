'use client';

import { useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { SystemNodeData } from '@/types';
import { AlertTriangle, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationIssue {
  id: string;
  nodeId?: string;
  severity: 'warning' | 'info';
  message: string;
}

export function ValidationPanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const { setCenter } = useReactFlow();
  const [collapsed, setCollapsed] = useState(false);

  const issues = useMemo<ValidationIssue[]>(() => {
    const result: ValidationIssue[] = [];
    const systemNodes = nodes.filter((n) => n.type === 'system');

    // Disconnected nodes (no edges at all)
    const connectedIds = new Set<string>();
    edges.forEach((e) => {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    });

    systemNodes.forEach((n) => {
      const data = n.data as SystemNodeData;

      if (!connectedIds.has(n.id)) {
        result.push({
          id: `disconnected-${n.id}`,
          nodeId: n.id,
          severity: 'warning',
          message: `"${data.label}" has no connections`,
        });
      }
    });

    // Single point of failure: nodes that are the only bridge between two parts
    // Simplified: nodes with high edge count but no redundancy
    const edgeCounts = new Map<string, number>();
    edges.forEach((e) => {
      edgeCounts.set(e.source, (edgeCounts.get(e.source) ?? 0) + 1);
      edgeCounts.set(e.target, (edgeCounts.get(e.target) ?? 0) + 1);
    });

    systemNodes.forEach((n) => {
      const data = n.data as SystemNodeData;
      const count = edgeCounts.get(n.id) ?? 0;
      // A node with 3+ connections could be a bottleneck
      if (count >= 4 && data.nodeType !== 'load-balancer' && data.nodeType !== 'api-gateway') {
        result.push({
          id: `bottleneck-${n.id}`,
          nodeId: n.id,
          severity: 'info',
          message: `"${data.label}" has ${count} connections — potential bottleneck`,
        });
      }
    });

    // Missing tech stack for certain node types
    const techRequiredTypes = ['database', 'cache', 'queue', 'load-balancer', 'cdn'];
    systemNodes.forEach((n) => {
      const data = n.data as SystemNodeData;
      if (techRequiredTypes.includes(data.nodeType) && data.techStack.length === 0) {
        result.push({
          id: `no-tech-${n.id}`,
          nodeId: n.id,
          severity: 'info',
          message: `"${data.label}" has no tech stack specified`,
        });
      }
    });

    // Database without any incoming connections (unused DB)
    systemNodes.forEach((n) => {
      const data = n.data as SystemNodeData;
      if (data.nodeType === 'database') {
        const hasIncoming = edges.some((e) => e.target === n.id);
        const hasOutgoing = edges.some((e) => e.source === n.id);
        if (!hasIncoming && hasOutgoing) {
          result.push({
            id: `db-no-read-${n.id}`,
            nodeId: n.id,
            severity: 'info',
            message: `"${data.label}" has no incoming connections`,
          });
        }
      }
    });

    return result;
  }, [nodes, edges]);

  if (issues.length === 0) return null;

  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  const handleJump = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNodeId(nodeId);
      setCenter(node.position.x + 80, node.position.y + 40, { zoom: 1.5, duration: 300 });
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-xs">
      <button
        onClick={() => setCollapsed((p) => !p)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors',
          warnings.length > 0
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
            : 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
        )}
      >
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          {warnings.length > 0 && `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
          {warnings.length > 0 && infos.length > 0 && ' · '}
          {infos.length > 0 && `${infos.length} hint${infos.length !== 1 ? 's' : ''}`}
        </span>
        {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>

      {!collapsed && (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
          {issues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => issue.nodeId && handleJump(issue.nodeId)}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
            >
              {issue.severity === 'warning' ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              )}
              <span className="text-foreground">{issue.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
