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

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface PresentationState {
  active: boolean;
  /** Index into the BFS node order computed by the presentation overlay. */
  index: number;
}

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 72;

function nodeSize(node: SystemNode) {
  const styleW = typeof node.style?.width === 'number' ? node.style.width : undefined;
  const styleH = typeof node.style?.height === 'number' ? node.style.height : undefined;
  return {
    width: node.measured?.width ?? node.width ?? styleW ?? DEFAULT_NODE_WIDTH,
    height: node.measured?.height ?? node.height ?? styleH ?? DEFAULT_NODE_HEIGHT,
  };
}

/** Swap a handle id's role, keeping its side: "bottom-source" → "bottom-target". */
function flipHandle(handle: string | null | undefined, role: 'source' | 'target') {
  if (!handle) return handle;
  const side = handle.split('-')[0];
  return `${side}-${role}`;
}

interface CanvasStore {
  // State
  nodes: SystemNode[];
  edges: SystemEdge[];
  viewport: Viewport;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  projectId: string | null;

  // Pending edge type selection (right after connecting)
  pendingEdge: PendingEdge | null;
  setPendingEdge: (pending: PendingEdge | null) => void;

  // Undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Clipboard
  clipboard: { nodes: SystemNode[]; edges: SystemEdge[] } | null;

  // Chrome
  libraryCollapsed: boolean;
  setLibraryCollapsed: (collapsed: boolean) => void;
  toggleLibrary: () => void;
  commandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  exportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (open: boolean) => void;

  // Presentation mode
  presentation: PresentationState;
  startPresentation: () => void;
  stopPresentation: () => void;
  setPresentationIndex: (index: number) => void;

  // Save status
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;

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
  reverseEdge: (edgeId: string) => void;
  setViewport: (viewport: Viewport) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  copySelection: () => void;
  pasteSelection: () => void;
  deleteSelection: () => void;
  selectAll: () => void;
  /** Duplicate the given nodes (default: current selection) plus edges between them. */
  duplicateNodes: (ids?: string[]) => void;
  /** Wrap the selected nodes in a new group node. */
  groupSelection: () => void;
  /** Line up the selected nodes along their dominant axis. */
  alignSelection: () => void;
  toggleLock: (ids: string[]) => void;
  bringToFront: (id: string) => void;
  clearCanvas: () => void;
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
  selectedEdgeId: null,
  projectId: null,
  history: [],
  historyIndex: -1,
  clipboard: null,
  pendingEdge: null,
  setPendingEdge: (pending) => set({ pendingEdge: pending }),

  libraryCollapsed: false,
  setLibraryCollapsed: (libraryCollapsed) => set({ libraryCollapsed }),
  toggleLibrary: () => set((state) => ({ libraryCollapsed: !state.libraryCollapsed })),
  commandMenuOpen: false,
  setCommandMenuOpen: (commandMenuOpen) => set({ commandMenuOpen }),
  shortcutsOpen: false,
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  exportOpen: false,
  setExportOpen: (exportOpen) => set({ exportOpen }),
  shareOpen: false,
  setShareOpen: (shareOpen) => set({ shareOpen }),

  presentation: { active: false, index: 0 },
  startPresentation: () => set({ presentation: { active: true, index: 0 }, pendingEdge: null }),
  stopPresentation: () => set((state) => ({ presentation: { ...state.presentation, active: false } })),
  setPresentationIndex: (index) => set((state) => ({ presentation: { ...state.presentation, index } })),

  saveStatus: 'saved',
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  initCanvas: (projectId, nodes, edges, viewport) => {
    set({
      projectId,
      nodes,
      edges,
      viewport,
      selectedNodeId: null,
      selectedEdgeId: null,
      history: [{ nodes, edges }],
      historyIndex: 0,
      presentation: { active: false, index: 0 },
      saveStatus: 'saved',
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
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
    }));
  },

  reverseEdge: (edgeId) => {
    get().pushHistory();
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              source: e.target,
              target: e.source,
              sourceHandle: flipHandle(e.targetHandle, 'source'),
              targetHandle: flipHandle(e.sourceHandle, 'target'),
            }
          : e
      ),
    }));
  },

  setViewport: (viewport) => set({ viewport }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

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

  duplicateNodes: (ids) => {
    const { nodes, edges } = get();
    const sourceIds = new Set(ids ?? nodes.filter((n) => n.selected).map((n) => n.id));
    if (sourceIds.size === 0) return;
    const now = Date.now();
    const idMap = new Map<string, string>();
    const copies = nodes
      .filter((n) => sourceIds.has(n.id))
      .map((node, i) => {
        const id = `node-${now}-${i}`;
        idMap.set(node.id, id);
        return {
          ...structuredClone(node),
          id,
          position: { x: node.position.x + 30, y: node.position.y + 30 },
          selected: true,
        };
      });
    const edgeCopies = edges
      .filter((e) => sourceIds.has(e.source) && sourceIds.has(e.target))
      .map((edge, i) => ({
        ...structuredClone(edge),
        id: `edge-${now}-${i}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: false,
      }));
    get().pushHistory();
    set((state) => ({
      nodes: [...state.nodes.map((n) => ({ ...n, selected: false })), ...copies],
      edges: [...state.edges, ...edgeCopies],
      selectedNodeId: copies.length === 1 ? copies[0].id : null,
      selectedEdgeId: null,
    }));
  },

  groupSelection: () => {
    const selected = get().nodes.filter((n) => n.selected && n.type !== 'group');
    if (selected.length === 0) return;
    const pad = 32;
    const labelSpace = 16;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of selected) {
      const { width, height } = nodeSize(node);
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    }
    const group: SystemNode = {
      id: `group-${Date.now()}`,
      type: 'group',
      position: { x: minX - pad, y: minY - pad - labelSpace },
      style: { width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 + labelSpace },
      data: { label: 'Group', nodeType: 'group', description: '', techStack: [] },
    };
    get().pushHistory();
    // Groups go first so they render behind their members.
    set((state) => ({
      nodes: [group, ...state.nodes.map((n) => ({ ...n, selected: false }))],
      selectedNodeId: null,
    }));
  },

  alignSelection: () => {
    const selected = get().nodes.filter((n) => n.selected);
    if (selected.length < 2) return;
    const centers = selected.map((n) => {
      const { width, height } = nodeSize(n);
      return { id: n.id, cx: n.position.x + width / 2, cy: n.position.y + height / 2, width, height };
    });
    const xs = centers.map((c) => c.cx);
    const ys = centers.map((c) => c.cy);
    const spreadX = Math.max(...xs) - Math.min(...xs);
    const spreadY = Math.max(...ys) - Math.min(...ys);
    // Spread out horizontally → put them on one row; otherwise one column.
    const alignRow = spreadX >= spreadY;
    const target = alignRow
      ? ys.reduce((a, b) => a + b, 0) / ys.length
      : xs.reduce((a, b) => a + b, 0) / xs.length;
    const byId = new Map(centers.map((c) => [c.id, c]));
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.map((n) => {
        const c = byId.get(n.id);
        if (!c) return n;
        return {
          ...n,
          position: alignRow
            ? { x: n.position.x, y: target - c.height / 2 }
            : { x: target - c.width / 2, y: n.position.y },
        };
      }),
    }));
  },

  toggleLock: (ids) => {
    const idSet = new Set(ids);
    const targets = get().nodes.filter((n) => idSet.has(n.id));
    if (targets.length === 0) return;
    const lock = targets.some((n) => n.draggable !== false);
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.map((n) =>
        idSet.has(n.id) ? { ...n, draggable: lock ? false : undefined } : n
      ),
    }));
  },

  bringToFront: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;
    get().pushHistory();
    set((state) => ({
      nodes: [...state.nodes.filter((n) => n.id !== id), node],
    }));
  },

  clearCanvas: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0 && edges.length === 0) return;
    get().pushHistory();
    set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null });
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
