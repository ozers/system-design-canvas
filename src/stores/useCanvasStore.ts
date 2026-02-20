import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Viewport,
} from '@xyflow/react';
import type { SystemNode, SystemEdge, SystemNodeData, SystemEdgeData } from '@/types';

interface HistoryEntry {
  nodes: SystemNode[];
  edges: SystemEdge[];
}

interface PendingEdge {
  edgeId: string;
  position: { x: number; y: number };
}

interface CanvasStore {
  // State
  nodes: SystemNode[];
  edges: SystemEdge[];
  viewport: Viewport;
  selectedNodeId: string | null;
  projectId: string | null;

  // Pending edge type selection
  pendingEdge: PendingEdge | null;
  setPendingEdge: (pending: PendingEdge | null) => void;

  // Undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Clipboard
  clipboard: { nodes: SystemNode[]; edges: SystemEdge[] } | null;

  // Grid snap
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;

  // Background
  backgroundVariant: 'dots' | 'lines' | 'cross' | 'none';
  cycleBackground: () => void;

  // Presentation mode
  presentationMode: boolean;
  togglePresentationMode: () => void;

  // Save status
  saveStatus: 'idle' | 'saving' | 'saved';
  setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void;

  // Actions
  initCanvas: (projectId: string, nodes: SystemNode[], edges: SystemEdge[], viewport: Viewport) => void;
  onNodesChange: (changes: NodeChange<SystemNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<SystemEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: SystemNode) => void;
  updateNodeData: (nodeId: string, data: Partial<SystemNodeData>) => void;
  updateEdgeData: (edgeId: string, data: Partial<SystemEdgeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  setViewport: (viewport: Viewport) => void;
  setSelectedNodeId: (id: string | null) => void;
  copySelection: () => void;
  pasteSelection: () => void;
  deleteSelection: () => void;
  selectAll: () => void;
  undo: () => void;
  redo: () => void;
  setNodes: (nodes: SystemNode[]) => void;
  setEdges: (edges: SystemEdge[]) => void;
  pushHistory: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
  projectId: null,
  history: [],
  historyIndex: -1,
  clipboard: null,
  pendingEdge: null,
  setPendingEdge: (pending) => set({ pendingEdge: pending }),
  snapToGrid: false,
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  backgroundVariant: 'dots' as const,
  cycleBackground: () => set((state) => {
    const variants = ['dots', 'lines', 'cross', 'none'] as const;
    const idx = variants.indexOf(state.backgroundVariant);
    return { backgroundVariant: variants[(idx + 1) % variants.length] };
  }),
  presentationMode: false,
  togglePresentationMode: () => set((state) => ({ presentationMode: !state.presentationMode })),
  saveStatus: 'idle' as const,
  setSaveStatus: (status) => set({ saveStatus: status }),

  initCanvas: (projectId, nodes, edges, viewport) => {
    set({
      projectId,
      nodes,
      edges,
      viewport,
      selectedNodeId: null,
      history: [{ nodes, edges }],
      historyIndex: 0,
    });
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    const id = crypto.randomUUID();
    const newEdge: SystemEdge = {
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'system',
      data: { edgeType: 'rest', label: '' },
    };
    get().pushHistory();
    set((state) => ({
      edges: [...state.edges, newEdge],
    }));
  },

  addNode: (node) => {
    get().pushHistory();
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  updateNodeData: (nodeId, data) => {
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },

  updateEdgeData: (edgeId, data) => {
    get().pushHistory();
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } as SystemEdgeData } : e
      ),
    }));
  },

  deleteNode: (nodeId) => {
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  deleteEdge: (edgeId) => {
    get().pushHistory();
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
  },

  setViewport: (viewport) => set({ viewport }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  copySelection: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const connectedEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
    );
    set({
      clipboard: {
        nodes: structuredClone(selectedNodes),
        edges: structuredClone(connectedEdges),
      },
    });
  },

  pasteSelection: () => {
    const { clipboard } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;
    const idMap = new Map<string, string>();
    const now = Date.now();
    const newNodes = clipboard.nodes.map((node, i) => {
      const newId = `node-${now}-${i}`;
      idMap.set(node.id, newId);
      return {
        ...structuredClone(node),
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: true,
      };
    });
    const newEdges = clipboard.edges.map((edge, i) => ({
      ...structuredClone(edge),
      id: `edge-${now}-${i}`,
      source: idMap.get(edge.source) ?? edge.source,
      target: idMap.get(edge.target) ?? edge.target,
    }));
    get().pushHistory();
    set((state) => ({
      nodes: [
        ...state.nodes.map((n) => ({ ...n, selected: false })),
        ...newNodes,
      ],
      edges: [...state.edges, ...newEdges],
      selectedNodeId: newNodes.length === 1 ? newNodes[0].id : null,
      clipboard: {
        nodes: structuredClone(newNodes),
        edges: structuredClone(newEdges),
      },
    }));
  },

  deleteSelection: () => {
    const { nodes } = get();
    const selectedIds = new Set(
      nodes.filter((n) => n.selected).map((n) => n.id)
    );
    if (selectedIds.size === 0) return;
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.filter((n) => !selectedIds.has(n.id)),
      edges: state.edges.filter(
        (e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)
      ),
      selectedNodeId:
        state.selectedNodeId && selectedIds.has(state.selectedNodeId)
          ? null
          : state.selectedNodeId,
    }));
  },

  selectAll: () => {
    set((state) => ({
      nodes: state.nodes.map((n) => ({ ...n, selected: true })),
    }));
  },

  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });
    // Keep max 50 entries
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      historyIndex: historyIndex - 1,
    });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({
      nodes: next.nodes,
      edges: next.edges,
      historyIndex: historyIndex + 1,
    });
  },
}));
