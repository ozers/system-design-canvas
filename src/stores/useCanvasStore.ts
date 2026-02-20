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
  clipboard: SystemNode | null;

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
  copyNode: () => void;
  pasteNode: () => void;
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

  copyNode: () => {
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) {
      set({ clipboard: structuredClone(node) });
    }
  },

  pasteNode: () => {
    const { clipboard } = get();
    if (!clipboard) return;
    const newNode: SystemNode = {
      ...structuredClone(clipboard),
      id: `node-${Date.now()}`,
      position: {
        x: clipboard.position.x + 50,
        y: clipboard.position.y + 50,
      },
    };
    get().pushHistory();
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
      clipboard: { ...structuredClone(clipboard), position: newNode.position },
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
