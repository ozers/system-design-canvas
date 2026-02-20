'use client';

import { useCallback, useEffect, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/stores/useCanvasStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { BaseSystemNode } from '@/components/nodes/BaseSystemNode';
import { StickyNote } from '@/components/nodes/StickyNote';
import { SystemEdge } from '@/components/edges/SystemEdge';
import { CanvasToolbar } from './CanvasToolbar';
import { NodePalette } from './NodePalette';
import { NodeEditor } from '@/components/nodes/NodeEditor';
import { Header } from '@/components/layout/Header';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import type { SystemNode, SystemEdge as SystemEdgeType, SystemNodeType, SystemNodeData } from '@/types';

const nodeTypes = { system: BaseSystemNode, note: StickyNote };
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
  const addNode = useCanvasStore((s) => s.addNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const pushHistory = useCanvasStore((s) => s.pushHistory);

  const { screenToFlowPosition } = useReactFlow();
  useAutoSave();
  useKeyboardShortcuts();

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
      const data: SystemNodeData = {
        label: config.label,
        nodeType,
        description: '',
        techStack: [...config.defaultTechStack],
      };

      addNode({
        id: `node-${Date.now()}`,
        type: 'system',
        position,
        data,
      });
    },
    [screenToFlowPosition, addNode]
  );

  const currentProject = projects.find((p) => p.id === projectId);

  return (
    <div className="flex h-screen w-screen flex-col">
      <Header projectName={currentProject?.name} showBack />
      <div className="relative flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onMoveEnd={onMoveEnd}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={viewport}
        defaultEdgeOptions={{ type: 'system' }}
        fitView={nodes.length === 0}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        deleteKeyCode={['Backspace', 'Delete']}
        className="bg-gray-50 dark:bg-gray-950"
      >
        <Background />
        <Controls position="top-right" />
        <MiniMap
          position="bottom-right"
          className="!bg-white !border !border-gray-200 !shadow-sm"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <CanvasToolbar />
      </ReactFlow>
      <NodePalette />
      <NodeEditor />
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
