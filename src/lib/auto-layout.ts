import Dagre from '@dagrejs/dagre';
import type { SystemNode, SystemEdge, SystemEdgeData } from '@/types';
import { getNodeRect, type Rect } from '@/lib/minimap';

type Direction = 'TB' | 'LR';
type Side = 'top' | 'right' | 'bottom' | 'left';

/** Boxes closer than this along the layout axis count as the same row. */
const ROW_OVERLAP = 16;

/** Async protocols can bend; synchronous call chains should stay straight. */
const ASYNC_EDGES = new Set(['pub-sub', 'mqtt', 'event-stream', 'websocket']);

/** Only component nodes take part in layout; groups and notes keep their positions. */
function isLayoutNode(node: SystemNode) {
  return node.type !== 'group' && node.type !== 'note';
}

/**
 * Pick the handle sides that face each other. In a top-to-bottom layout, nodes on
 * different rows connect bottom → top and nodes on the same row connect side to side
 * (left-to-right layouts mirror this).
 */
export function facingSides(source: Rect, target: Rect, direction: Direction = 'TB'): [Side, Side] {
  const below = target.y + target.height / 2 >= source.y + source.height / 2;
  const right = target.x + target.width / 2 >= source.x + source.width / 2;
  const verticalGap = below ? target.y - (source.y + source.height) : source.y - (target.y + target.height);
  const horizontalGap = right ? target.x - (source.x + source.width) : source.x - (target.x + target.width);
  const vertical: [Side, Side] = below ? ['bottom', 'top'] : ['top', 'bottom'];
  const horizontal: [Side, Side] = right ? ['right', 'left'] : ['left', 'right'];

  if (direction === 'TB') return verticalGap > ROW_OVERLAP ? vertical : horizontal;
  return horizontalGap > ROW_OVERLAP ? horizontal : vertical;
}

/** Re-point every edge between component nodes to the sides that face each other. */
export function orientEdgeHandles(nodes: SystemNode[], edges: SystemEdge[], direction: Direction = 'TB'): SystemEdge[] {
  const rects = new Map(nodes.filter(isLayoutNode).map((n) => [n.id, getNodeRect(n)]));
  return edges.map((edge) => {
    const source = rects.get(edge.source);
    const target = rects.get(edge.target);
    if (!source || !target) return edge;
    const [sourceSide, targetSide] = facingSides(source, target, direction);
    const sourceHandle = `${sourceSide}-source`;
    const targetHandle = `${targetSide}-target`;
    if (edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) return edge;
    return { ...edge, sourceHandle, targetHandle };
  });
}

export function getLayoutedElements(
  nodes: SystemNode[],
  edges: SystemEdge[],
  direction: Direction = 'TB'
) {
  const layoutNodes = nodes.filter(isLayoutNode);
  if (layoutNodes.length === 0) return { nodes, edges };

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 72, ranksep: 96, edgesep: 24, ranker: 'network-simplex' });

  // Insert in reading order so dagre keeps the user's left-to-right arrangement where it can.
  const ordered = [...layoutNodes].sort((a, b) =>
    direction === 'TB' ? a.position.x - b.position.x || a.position.y - b.position.y
      : a.position.y - b.position.y || a.position.x - b.position.x
  );
  for (const node of ordered) {
    const { width, height } = getNodeRect(node);
    g.setNode(node.id, { width, height });
  }

  const isAsync = (edge: SystemEdge) =>
    ASYNC_EDGES.has((edge.data as SystemEdgeData | undefined)?.edgeType ?? 'rest');
  const inLayout = (edge: SystemEdge) =>
    g.hasNode(edge.source) && g.hasNode(edge.target) && edge.source !== edge.target;

  // An async hand-off into a node that is already reached by a synchronous call shouldn't push
  // that node a row further down, so it is left out of ranking (it is still drawn). dagre can't
  // take same-rank constraints (minlen 0 throws), so skipping the edge is how we express this.
  const syncTargets = new Set(edges.filter((e) => inLayout(e) && !isAsync(e)).map((e) => e.target));
  const isSkippable = (edge: SystemEdge) => isAsync(edge) && syncTargets.has(edge.target);
  const anchored = new Set<string>();
  for (const edge of edges) {
    if (!inLayout(edge) || isSkippable(edge)) continue;
    anchored.add(edge.source);
    anchored.add(edge.target);
  }

  for (const edge of edges) {
    if (!inLayout(edge)) continue;
    // Keep the edge if skipping it would leave its source floating on its own.
    if (isSkippable(edge) && anchored.has(edge.source)) continue;
    g.setEdge(edge.source, edge.target, { weight: isAsync(edge) ? 1 : 4, minlen: 1 });
  }

  try {
    Dagre.layout(g);
  } catch (error) {
    // Never lose the user's diagram to a layout bug: keep positions, still fix handle sides.
    console.error('Auto layout failed', error);
    return { nodes, edges: orientEdgeHandles(nodes, edges, direction) };
  }

  const layoutedNodes = nodes.map((node) => {
    if (!isLayoutNode(node)) return node;
    const dagreNode = g.node(node.id);
    const { width, height } = getNodeRect(node);
    return {
      ...node,
      position: {
        x: Math.round(dagreNode.x - width / 2),
        y: Math.round(dagreNode.y - height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges: orientEdgeHandles(layoutedNodes, edges, direction) };
}
