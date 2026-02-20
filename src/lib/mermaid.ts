import type { SystemNode, SystemEdge, SystemNodeData, SystemEdgeData } from '@/types';

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function sanitizeLabel(label: string): string {
  return label.replace(/"/g, "'");
}

function getEdgeStyle(edgeType: string): string {
  switch (edgeType) {
    case 'rest':
    case 'grpc':
    case 'graphql':
    case 'tcp':
      return '-->';
    case 'websocket':
    case 'pub-sub':
    case 'mqtt':
    case 'event-stream':
      return '-.->';
    case 'db-query':
      return '==>';
    default:
      return '-->';
  }
}

export function exportToMermaid(nodes: SystemNode[], edges: SystemEdge[]): string {
  const lines: string[] = ['graph TD'];

  // Nodes
  for (const node of nodes) {
    const data = node.data as SystemNodeData;
    if (!data || node.type === 'note' || node.type === 'group') continue;

    const id = sanitizeId(node.id);
    const label = sanitizeLabel(data.label || data.nodeType);
    const tech = data.techStack.length > 0 ? `<br/>${data.techStack.join(', ')}` : '';

    // Use different shapes based on node type
    switch (data.nodeType) {
      case 'database':
      case 'cache':
      case 'object-storage':
      case 'search-index':
        lines.push(`    ${id}[("${label}${tech}")]`); // cylinder
        break;
      case 'queue':
      case 'stream':
        lines.push(`    ${id}[["${label}${tech}"]]`); // subroutine
        break;
      case 'client':
        lines.push(`    ${id}("${label}${tech}")`); // rounded
        break;
      case 'load-balancer':
      case 'dns':
      case 'waf':
      case 'api-gateway':
        lines.push(`    ${id}{{"${label}${tech}"}}`); // hexagon
        break;
      default:
        lines.push(`    ${id}["${label}${tech}"]`); // rectangle
    }
  }

  lines.push('');

  // Edges
  for (const edge of edges) {
    const data = edge.data as SystemEdgeData | undefined;
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    const arrow = getEdgeStyle(data?.edgeType ?? 'rest');
    const label = data?.label ? `|"${sanitizeLabel(data.label)}"|` : '';

    lines.push(`    ${sourceId} ${arrow}${label} ${targetId}`);
  }

  return lines.join('\n');
}
