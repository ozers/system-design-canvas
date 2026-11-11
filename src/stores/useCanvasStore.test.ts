import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from './useCanvasStore';
import type { SystemEdge, SystemNode } from '@/types';

const node = (id: string, selected = false): SystemNode =>
  ({ id, type: 'system', position: { x: 0, y: 0 }, selected, data: { label: id, nodeType: 'service', techStack: [] } }) as SystemNode;
const edge = (id: string, source: string, target: string): SystemEdge => ({
  id,
  source,
  target,
  sourceHandle: 'right-source',
  targetHandle: 'left-target',
  type: 'system',
  data: { edgeType: 'rest', label: '' },
});

const s = () => useCanvasStore.getState();
const ids = (items: { id: string }[]) => items.map((i) => i.id);

// Monolith-like: 5 nodes, 4 edges (the QA #2 case).
const NODES = ['client', 'lb', 'app', 'db', 'cache'];
const EDGES = [edge('e1', 'client', 'lb'), edge('e2', 'lb', 'app'), edge('e3', 'app', 'db'), edge('e4', 'app', 'cache')];

describe('canvas history', () => {
  beforeEach(() => {
    s().initCanvas('p', NODES.map((id) => node(id)), EDGES, { x: 0, y: 0, zoom: 1 });
  });

  it('removes many nodes and edges as one undo step', () => {
    s().removeElements(NODES, ids(EDGES));
    expect(s().nodes).toHaveLength(0);
    expect(s().edges).toHaveLength(0);
    expect(s().past).toHaveLength(1);

    s().undo();
    expect(ids(s().nodes)).toEqual(NODES);
    expect(ids(s().edges)).toEqual(ids(EDGES));
    expect(s().past).toHaveLength(0);
  });

  it('drops edges of removed nodes and clears the selected ids', () => {
    s().setSelectedEdgeId('e3');
    s().removeElements(['db'], []);
    expect(ids(s().edges)).toEqual(['e1', 'e2', 'e4']);
    expect(s().selectedEdgeId).toBeNull();
  });

  it('records nothing when there is nothing to remove', () => {
    s().removeElements(['nope'], ['nope']);
    expect(s().past).toHaveLength(0);
  });

  it('deleteSelection removes selected nodes and selected edges in one step', () => {
    s().setNodes(s().nodes.map((n) => ({ ...n, selected: n.id === 'cache' })));
    s().setEdges(s().edges.map((e) => ({ ...e, selected: e.id === 'e1' })));
    s().deleteSelection();
    expect(ids(s().nodes)).toEqual(['client', 'lb', 'app', 'db']);
    expect(ids(s().edges)).toEqual(['e2', 'e3']);
    s().undo();
    expect(ids(s().nodes)).toEqual(NODES);
    expect(ids(s().edges)).toEqual(ids(EDGES));
  });

  it('undoes one action at a time and redoes it back', () => {
    s().addNode(node('x'));
    s().addNode(node('y'));
    s().undo();
    expect(ids(s().nodes)).toEqual([...NODES, 'x']);
    s().undo();
    expect(ids(s().nodes)).toEqual(NODES);
    s().undo(); // nothing left
    expect(ids(s().nodes)).toEqual(NODES);
    s().redo();
    s().redo();
    expect(ids(s().nodes)).toEqual([...NODES, 'x', 'y']);
    expect(s().future).toHaveLength(0);
  });

  it('a new change clears redo', () => {
    s().addNode(node('x'));
    s().undo();
    s().addNode(node('z'));
    s().redo();
    expect(ids(s().nodes)).toEqual([...NODES, 'z']);
  });

  it('undo after duplicate + delete brings back the copies with their edges', () => {
    s().duplicateNodes(['app', 'db']);
    const copies = s().nodes.filter((n) => !NODES.includes(n.id));
    expect(copies).toHaveLength(2);
    expect(s().edges).toHaveLength(5);
    s().removeElements(ids(copies), []);
    expect(s().edges).toHaveLength(4);
    s().undo();
    expect(s().nodes).toHaveLength(7);
    expect(s().edges).toHaveLength(5);
  });
});
