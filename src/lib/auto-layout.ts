import Dagre from '@dagrejs/dagre';
import type { SystemNode, SystemEdge } from '@/types';

export function getLayoutedElements(
  nodes: SystemNode[],
  edges: SystemEdge[],
  direction: 'TB' | 'LR' = 'TB'
) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.measured?.width ?? 200,
      height: node.measured?.height ?? 100,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const width = node.measured?.width ?? 200;
    const height = node.measured?.height ?? 100;
    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
