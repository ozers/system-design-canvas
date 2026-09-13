'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  SelectionMode,
  reconnectEdge,
  useReactFlow,
  useStore,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type OnReconnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { BaseSystemNode } from '@/components/nodes/BaseSystemNode';
import { GroupNode } from '@/components/nodes/GroupNode';
import { StickyNote } from '@/components/nodes/StickyNote';
import { NodeEditor } from '@/components/nodes/NodeEditor';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { SystemEdge } from '@/components/edges/SystemEdge';
import { EdgeEditor } from '@/components/edges/EdgeEditor';
import { ConnectionTypePicker } from '@/components/edges/ConnectionTypePicker';
import { CanvasHeader } from '@/components/layout/CanvasHeader';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsNarrow } from '@/hooks/useMediaQuery';
import { createSystemNode } from '@/lib/node-factory';
import { getMinimapColor } from '@/lib/minimap';
import { computeIssues, ValidationWarningsContext } from '@/lib/validation';
import { cn } from '@/lib/utils';
import type { SystemNode, SystemEdge as SystemEdgeModel, SystemNodeType } from '@/types';
import { CanvasToolbar } from './CanvasToolbar';
import { NodePalette } from './NodePalette';
import { ValidationPanel } from './ValidationPanel';
import { SelectionActions } from './SelectionActions';
import { EmptyCanvas } from './EmptyCanvas';
import { PresentationOverlay } from './PresentationOverlay';
import { CanvasContextMenu, type ContextMenuState } from './CanvasContextMenu';
import { CommandMenu } from './CommandMenu';
import { ShortcutsDialog } from './ShortcutsDialog';
import { OnboardingOverlay } from './OnboardingOverlay';
import { ShareDialog } from './ShareDialog';
import { ExportDialog } from './ExportDialog';
import { getFitViewOptions, presentationOrder } from './canvas-helpers';

const nodeTypes = { system: BaseSystemNode, group: GroupNode, note: StickyNote };
const edgeTypes = { system: SystemEdge };
const DELETE_KEYS = ['Backspace', 'Delete'];
const LIBRARY_WIDTH = 260 + 16;

/** Dot grid: gap scales with zoom, dots stay ~1px like the Studio canvas ground. */
function DotGrid() {
  const zoom = useStore((s) => s.transform[2]);
  return <Background variant={BackgroundVariant.Dots} gap={20} size={2 / zoom} color="var(--dots)" />;
}

function CanvasInner({ projectId }: { projectId: string }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useCanvasStore((s) => s.viewport);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange) as OnNodesChange<SystemNode>;
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange) as OnEdgesChange<SystemEdgeModel>;
  const onConnect = useCanvasStore((s) => s.onConnect) as OnConnect;
  const setViewport = useCanvasStore((s) => s.setViewport);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const initCanvas = useCanvasStore((s) => s.initCanvas);
  const addNode = useCanvasStore((s) => s.addNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const setPendingEdge = useCanvasStore((s) => s.setPendingEdge);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const presentation = useCanvasStore((s) => s.presentation);
  const setPresentationIndex = useCanvasStore((s) => s.setPresentationIndex);
  const libraryCollapsed = useCanvasStore((s) => s.libraryCollapsed);
  const setLibraryCollapsed = useCanvasStore((s) => s.setLibraryCollapsed);

  const snap = useSettingsStore((s) => s.snap);
  const showMinimapSetting = useSettingsStore((s) => s.minimap);
  const validationEnabled = useSettingsStore((s) => s.validation);
  const animatedEdges = useSettingsStore((s) => s.animatedEdges);

  const narrow = useIsNarrow();
  const presenting = presentation.active;

  const connectEndPos = useRef<{ x: number; y: number } | null>(null);
  const edgeReconnectSuccessful = useRef(true);

  const { screenToFlowPosition, fitView } = useReactFlow();
  useAutoSave();
  useKeyboardShortcuts();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const loaded = useProjectStore((s) => s.loaded);
  const currentProject = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  useEffect(() => {
    if (!loaded) return;
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId);
    if (!project) return;
    initCanvas(projectId, project.nodes as SystemNode[], project.edges as SystemEdgeModel[], project.viewport);
    requestAnimationFrame(() => {
      fitView(getFitViewOptions(200));
    });
  }, [projectId, loaded, initCanvas, fitView]);

  // Library starts collapsed (i.e. the bottom sheet closed) on narrow screens.
  useEffect(() => {
    if (narrow) setLibraryCollapsed(true);
  }, [narrow, setLibraryCollapsed]);

  // ── Derived chrome state ───────────────────────────────
  const selectedCount = useMemo(() => nodes.reduce((n, node) => n + (node.selected ? 1 : 0), 0), [nodes]);
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  const nodeEditorOpen = selectedNode?.type === 'system' && selectedCount < 2;
  const edgeEditorOpen = !!selectedEdgeId && edges.some((e) => e.id === selectedEdgeId);
  const editorOpen = !presenting && (nodeEditorOpen || edgeEditorOpen);

  const issues = useMemo(() => computeIssues(nodes, edges), [nodes, edges]);
  const validationActive = validationEnabled && !presenting;
  // Stable identity while the set of warned nodes is unchanged, so nodes don't re-render on every drag frame.
  const warningKey = validationActive
    ? issues
        .filter((i) => i.severity === 'warning')
        .map((i) => i.nodeId)
        .join('|')
    : '';
  const warningNodeIds = useMemo<ReadonlySet<string>>(
    () => new Set(warningKey ? warningKey.split('|') : []),
    [warningKey]
  );

  // ── Presentation ───────────────────────────────────────
  const presentationStartId = selectedNodeId ?? nodes.find((n) => n.selected)?.id;
  const order = useMemo(
    () => (presenting ? presentationOrder(nodes, edges, presentationStartId) : []),
    [presenting, nodes, edges, presentationStartId]
  );
  const currentId = order.length > 0 ? order[Math.min(presentation.index, order.length - 1)].id : undefined;

  const flowNodes = useMemo(() => {
    if (!presenting) return nodes;
    const neighbors = new Set<string>();
    for (const e of edges) {
      if (e.source === currentId) neighbors.add(e.target);
      if (e.target === currentId) neighbors.add(e.source);
    }
    return nodes.map((n) => {
      const opacity = n.id === currentId ? 1 : neighbors.has(n.id) ? 0.7 : 0.25;
      return { ...n, selected: n.id === currentId, style: { ...n.style, opacity } };
    });
  }, [presenting, nodes, edges, currentId]);

  const flowEdges = useMemo(() => {
    if (!presenting) return edges;
    return edges.map((e) => {
      const opacity = e.source === currentId || e.target === currentId ? 1 : 0.2;
      return { ...e, selected: false, style: { ...e.style, opacity } };
    });
  }, [presenting, edges, currentId]);

  // ── Handlers ───────────────────────────────────────────
  const onNodeClick = useCallback(
    (_: ReactMouseEvent, node: SystemNode) => {
      if (useCanvasStore.getState().presentation.active) {
        const i = order.findIndex((n) => n.id === node.id);
        if (i >= 0) setPresentationIndex(i);
        return;
      }
      setSelectedNodeId(node.id);
    },
    [order, setPresentationIndex, setSelectedNodeId]
  );

  const onEdgeClick = useCallback(
    (_: ReactMouseEvent, edge: SystemEdgeModel) => {
      if (useCanvasStore.getState().presentation.active) return;
      setSelectedEdgeId(edge.id);
    },
    [setSelectedEdgeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const onNodesDelete = useCallback((deleted: SystemNode[]) => deleted.forEach((n) => deleteNode(n.id)), [deleteNode]);
  const onEdgesDelete = useCallback(
    (deleted: SystemEdgeModel[]) => deleted.forEach((e) => deleteEdge(e.id)),
    [deleteEdge]
  );

  const onMoveEnd = useCallback(
    (_: unknown, vp: { x: number; y: number; zoom: number }) => setViewport(vp),
    [setViewport]
  );

  const onNodeDragStop = useCallback(() => pushHistory(), [pushHistory]);

  const handleConnect: OnConnect = useCallback(
    (connection) => {
      onConnect(connection);
      if (!connectEndPos.current) return;
      const latest = useCanvasStore.getState().edges;
      const newEdge = latest[latest.length - 1];
      if (newEdge) setPendingEdge({ edgeId: newEdge.id, position: connectEndPos.current });
    },
    [onConnect, setPendingEdge]
  );

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    connectEndPos.current =
      'changedTouches' in event
        ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
        : { x: event.clientX, y: event.clientY };
  }, []);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect: OnReconnect<SystemEdgeModel> = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      pushHistory();
      setEdges(reconnectEdge(oldEdge, newConnection, useCanvasStore.getState().edges) as SystemEdgeModel[]);
    },
    [pushHistory, setEdges]
  );

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: SystemEdgeModel) => {
      if (!edgeReconnectSuccessful.current) deleteEdge(edge.id);
    },
    [deleteEdge]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow-nodetype') as SystemNodeType;
      if (!nodeType || !(nodeType in NODE_REGISTRY)) return;
      const p = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const isGroup = nodeType === 'group';
      addNode(createSystemNode(nodeType, { x: p.x - (isGroup ? 160 : 100), y: p.y - (isGroup ? 100 : 36) }));
    },
    [screenToFlowPosition, addNode]
  );

  const onPaneContextMenu = useCallback((event: MouseEvent | ReactMouseEvent) => {
    event.preventDefault();
    if (useCanvasStore.getState().presentation.active) return;
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeContextMenu = useCallback((event: ReactMouseEvent, node: SystemNode) => {
    event.preventDefault();
    if (useCanvasStore.getState().presentation.active) return;
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const showMinimap = showMinimapSetting && !narrow && !presenting && !editorOpen;
  const showValidation = validationActive && !(narrow && editorOpen);
  const libraryOffset = !narrow && !libraryCollapsed ? LIBRARY_WIDTH : 0;

  return (
    <div className="flex h-dvh w-screen flex-col bg-bg">
      {!presenting && <CanvasHeader projectId={projectId} projectName={currentProject?.name} />}
      <div className={cn('relative flex-1 overflow-hidden', !animatedEdges && 'edges-static')}>
        <ValidationWarningsContext.Provider value={warningNodeIds}>
          <ReactFlow<SystemNode, SystemEdgeModel>
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onConnectEnd={onConnectEnd}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onMoveEnd={onMoveEnd}
            onNodeDragStop={onNodeDragStop}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultViewport={viewport}
            defaultEdgeOptions={{ type: 'system' }}
            fitView
            fitViewOptions={getFitViewOptions()}
            connectionMode={ConnectionMode.Loose}
            selectionMode={SelectionMode.Partial}
            snapToGrid={snap}
            snapGrid={[20, 20]}
            nodesDraggable={!presenting}
            nodesConnectable={!presenting}
            elementsSelectable={!presenting}
            edgesReconnectable={!presenting}
            deleteKeyCode={presenting ? null : DELETE_KEYS}
            className="bg-bg"
          >
            <DotGrid />
            {showMinimap && (
              <MiniMap<SystemNode>
                position="bottom-right"
                pannable
                zoomable
                nodeColor={getMinimapColor}
                nodeBorderRadius={14}
                maskColor="color-mix(in oklch, var(--bg) 55%, transparent)"
                maskStrokeColor="var(--accent)"
                maskStrokeWidth={1}
                bgColor="transparent"
                style={{ width: 176, height: 112 }}
                className="!m-4 overflow-hidden rounded-[12px] border border-line shadow-[var(--shadow-lg)]"
              />
            )}
          </ReactFlow>
        </ValidationWarningsContext.Provider>

        {!presenting && (
          <>
            <NodePalette />
            <CanvasToolbar />
            <SelectionActions />
            {showValidation && <ValidationPanel issues={issues} editorOpen={editorOpen} />}
            {nodes.length === 0 && <EmptyCanvas offsetLeft={libraryOffset} />}
          </>
        )}

        <NodeEditor />
        <EdgeEditor />
        <ConnectionTypePicker />

        {presenting && <PresentationOverlay order={order} projectName={currentProject?.name} />}
        {contextMenu && !presenting && (
          <CanvasContextMenu key={`${contextMenu.x}-${contextMenu.y}`} menu={contextMenu} onClose={closeContextMenu} />
        )}

        <CommandMenu />
        <ShortcutsDialog />
        <OnboardingOverlay />
        <ShareDialog />
        <ExportDialog />
      </div>
    </div>
  );
}

export function Canvas({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasInner projectId={projectId} />
    </ReactFlowProvider>
  );
}
