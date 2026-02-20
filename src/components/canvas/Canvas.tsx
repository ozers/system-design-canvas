'use client';

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  SelectionMode,
  reconnectEdge,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type OnReconnect,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { BaseSystemNode } from '@/components/nodes/BaseSystemNode';
import { GroupNode } from '@/components/nodes/GroupNode';
import { StickyNote } from '@/components/nodes/StickyNote';
import { SystemEdge } from '@/components/edges/SystemEdge';
import { ConnectionTypePicker } from '@/components/edges/ConnectionTypePicker';
import { CanvasToolbar } from './CanvasToolbar';
import { NodePalette } from './NodePalette';
import { NodeEditor } from '@/components/nodes/NodeEditor';
import { Header } from '@/components/layout/Header';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { OnboardingOverlay } from './OnboardingOverlay';
import { CanvasContextMenu, type ContextMenuState } from './CanvasContextMenu';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import type { SystemNode, SystemEdge as SystemEdgeType, SystemNodeType, SystemNodeData } from '@/types';

const MINIMAP_NODE_COLORS: Record<string, string> = {
  service: '#93bbfd',
  database: '#86e0a5',
  cache: '#fcd68d',
  queue: '#f9a8d4',
  'load-balancer': '#a5b4fc',
  client: '#c4b5fd',
  cdn: '#7dd3c4',
  'api-gateway': '#fca5a5',
  group: '#94a3b8',
  note: '#fcd68d',
  dns: '#7dd3fc',
  waf: '#fdba74',
  worker: '#94a3b8',
  serverless: '#c4b5fd',
  'container-cluster': '#67e8f9',
  'object-storage': '#6ee7b7',
  'search-index': '#fde047',
  stream: '#fda4af',
  scheduler: '#a8a29e',
  logging: '#bef264',
  monitoring: '#f0abfc',
};

function getMinimapNodeColor(node: SystemNode): string {
  if (node.type === 'note') return MINIMAP_NODE_COLORS.note;
  if (node.type === 'group') return MINIMAP_NODE_COLORS.group;
  const nodeType = (node.data as SystemNodeData)?.nodeType;
  return MINIMAP_NODE_COLORS[nodeType] ?? '#94a3b8';
}

const nodeTypes = { system: BaseSystemNode, group: GroupNode, note: StickyNote };
const edgeTypes = { system: SystemEdge };

function CanvasInner({ projectId }: { projectId: string }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useCanvasStore((s) => s.viewport);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange) as OnNodesChange<SystemNode>;
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange) as OnEdgesChange<SystemEdgeType>;
  const onConnect = useCanvasStore((s) => s.onConnect) as OnConnect;
  const setViewport = useCanvasStore((s) => s.setViewport);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const initCanvas = useCanvasStore((s) => s.initCanvas);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const backgroundVariant = useCanvasStore((s) => s.backgroundVariant);
  const presentationMode = useCanvasStore((s) => s.presentationMode);
  const togglePresentationMode = useCanvasStore((s) => s.togglePresentationMode);
  const addNode = useCanvasStore((s) => s.addNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const setPendingEdge = useCanvasStore((s) => s.setPendingEdge);
  const setEdges = useCanvasStore((s) => s.setEdges);

  const connectEndPos = useRef<{ x: number; y: number } | null>(null);
  const edgeReconnectSuccessful = useRef(true);

  const { screenToFlowPosition, fitView } = useReactFlow();
  useAutoSave();
  useKeyboardShortcuts();

  // Context menu + copy/paste
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [clipboard, setClipboard] = useState<SystemNode | null>(null);

  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const loaded = useProjectStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  useEffect(() => {
    if (!loaded) return;
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      initCanvas(
        projectId,
        project.nodes as SystemNode[],
        project.edges as SystemEdgeType[],
        project.viewport
      );
      // Center the view on nodes after React Flow renders them
      requestAnimationFrame(() => {
        fitView({ padding: 0.15, duration: 200 });
      });
    }
  }, [projectId, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: SystemNode) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId]);

  const onNodesDelete = useCallback(
    (deleted: SystemNode[]) => {
      deleted.forEach((n) => deleteNode(n.id));
    },
    [deleteNode]
  );

  const onEdgesDelete = useCallback(
    (deleted: SystemEdgeType[]) => {
      deleted.forEach((e) => deleteEdge(e.id));
    },
    [deleteEdge]
  );

  const onMoveEnd = useCallback(
    (_: unknown, vp: { x: number; y: number; zoom: number }) => {
      setViewport(vp);
    },
    [setViewport]
  );

  const onNodeDragStop = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  // Wrap onConnect to show type picker after connection
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      onConnect(connection);
      // After the edge is created, show type picker at cursor position
      if (connectEndPos.current) {
        // Get the newest edge (just created by onConnect)
        const latestEdges = useCanvasStore.getState().edges;
        const newEdge = latestEdges[latestEdges.length - 1];
        if (newEdge) {
          setPendingEdge({
            edgeId: newEdge.id,
            position: connectEndPos.current,
          });
        }
      }
    },
    [onConnect, setPendingEdge]
  );

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const pos = 'changedTouches' in event
      ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
      : { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
    connectEndPos.current = pos;
  }, []);

  // Edge reconnect handlers
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      pushHistory();
      setEdges(reconnectEdge(oldEdge, newConnection, useCanvasStore.getState().edges) as SystemEdgeType[]);
    },
    [pushHistory, setEdges]
  );

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: SystemEdgeType) => {
      if (!edgeReconnectSuccessful.current) {
        deleteEdge(edge.id);
      }
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
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const config = NODE_REGISTRY[nodeType];
      const isGroup = nodeType === 'group';
      const data: SystemNodeData = {
        label: isGroup ? '' : config.label,
        nodeType,
        description: '',
        techStack: [...config.defaultTechStack],
      };

      addNode({
        id: `node-${Date.now()}`,
        type: isGroup ? 'group' : 'system',
        position,
        ...(isGroup ? { style: { width: 300, height: 200 } } : {}),
        data,
      });
    },
    [screenToFlowPosition, addNode]
  );

  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: SystemNode) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const handleCopy = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) setClipboard(node);
  }, [nodes]);

  const handlePaste = useCallback((screenX: number, screenY: number) => {
    if (!clipboard) return;
    const position = screenToFlowPosition({ x: screenX, y: screenY });
    addNode({
      id: `node-${Date.now()}`,
      type: clipboard.type,
      position,
      ...(clipboard.type === 'group' ? { style: { width: 300, height: 200 } } : {}),
      data: { ...clipboard.data },
    });
  }, [clipboard, screenToFlowPosition, addNode]);

  // Ctrl+C / Ctrl+V keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const selectedId = useCanvasStore.getState().selectedNodeId;
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedId) {
        const node = useCanvasStore.getState().nodes.find((n) => n.id === selectedId);
        if (node) setClipboard(node);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboard) {
        // Paste at center of viewport
        const el = document.querySelector('.react-flow');
        if (el) {
          const rect = el.getBoundingClientRect();
          handlePaste(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [clipboard, handlePaste]);

  const currentProject = projects.find((p) => p.id === projectId);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const isEditorOpen = !!selectedNode;

  return (
    <div className="flex h-screen w-screen flex-col">
      {!presentationMode && <Header projectName={currentProject?.name} showBack />}
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onConnectEnd={onConnectEnd}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            onNodeClick={onNodeClick}
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
            fitViewOptions={{ padding: 0.15 }}
            selectionMode={SelectionMode.Partial}
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-background"
          >
            {backgroundVariant !== 'none' && (
              <Background variant={
                backgroundVariant === 'dots' ? BackgroundVariant.Dots :
                backgroundVariant === 'lines' ? BackgroundVariant.Lines :
                BackgroundVariant.Cross
              } />
            )}
            {!presentationMode && <Controls position="top-right" />}
            {!presentationMode && (
              <MiniMap
                position="bottom-right"
                className="!bg-card !border !border-border !shadow-sm minimap-mask"
                nodeColor={getMinimapNodeColor}
              />
            )}
            {!presentationMode && <CanvasToolbar />}
          </ReactFlow>
          {!presentationMode && <NodePalette />}
          {!presentationMode && <ConnectionTypePicker />}
          {!presentationMode && <OnboardingOverlay />}
          {presentationMode && (
            <button
              onClick={togglePresentationMode}
              className="absolute top-4 right-4 z-10 rounded-lg border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm opacity-0 hover:opacity-100 transition-opacity"
            >
              Press Esc to exit
            </button>
          )}
          {contextMenu && (
            <CanvasContextMenu
              menu={contextMenu}
              onClose={() => setContextMenu(null)}
              clipboard={clipboard}
              onCopy={handleCopy}
              onPaste={handlePaste}
            />
          )}
        </div>
        {isEditorOpen && !presentationMode && <NodeEditor />}
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
