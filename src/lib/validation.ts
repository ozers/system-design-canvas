import { createContext, useContext } from 'react';
import type { SystemNode, SystemEdge, SystemNodeData } from '@/types';

export interface ValidationIssue {
  id: string;
  nodeId: string;
  nodeLabel: string;
  severity: 'warning' | 'info';
  /** Sentence fragment that follows the node name, e.g. "has no connections". */
  message: string;
}

const TECH_REQUIRED = new Set(['database', 'cache', 'queue', 'load-balancer', 'cdn']);
const HUB_TYPES = new Set(['load-balancer', 'api-gateway']);

/** Design checks that run on every change. */
export function computeIssues(nodes: SystemNode[], edges: SystemEdge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const systemNodes = nodes.filter((n) => n.type === 'system');

  const edgeCounts = new Map<string, number>();
  const incoming = new Set<string>();
  const outgoing = new Set<string>();
  for (const e of edges) {
    edgeCounts.set(e.source, (edgeCounts.get(e.source) ?? 0) + 1);
    edgeCounts.set(e.target, (edgeCounts.get(e.target) ?? 0) + 1);
    outgoing.add(e.source);
    incoming.add(e.target);
  }

  for (const n of systemNodes) {
    const data = n.data as SystemNodeData;
    const label = data.label || 'Untitled';
    const count = edgeCounts.get(n.id) ?? 0;

    if (count === 0) {
      issues.push({ id: `disconnected-${n.id}`, nodeId: n.id, nodeLabel: label, severity: 'warning', message: 'has no connections' });
    }
    if (count >= 4 && !HUB_TYPES.has(data.nodeType)) {
      issues.push({ id: `bottleneck-${n.id}`, nodeId: n.id, nodeLabel: label, severity: 'info', message: `has ${count} connections — potential bottleneck` });
    }
    if (TECH_REQUIRED.has(data.nodeType) && data.techStack.length === 0) {
      issues.push({ id: `no-tech-${n.id}`, nodeId: n.id, nodeLabel: label, severity: 'info', message: 'has no tech stack specified' });
    }
    if (data.nodeType === 'database' && outgoing.has(n.id) && !incoming.has(n.id)) {
      issues.push({ id: `db-no-read-${n.id}`, nodeId: n.id, nodeLabel: label, severity: 'info', message: 'has no incoming connections' });
    }
  }

  // Warnings first
  return issues.sort((a, b) => Number(a.severity === 'info') - Number(b.severity === 'info'));
}

/** Node ids with a warning-level issue; Canvas provides it, nodes read it for the badge. */
export const ValidationWarningsContext = createContext<ReadonlySet<string>>(new Set());

export function useHasValidationWarning(nodeId: string) {
  return useContext(ValidationWarningsContext).has(nodeId);
}
