'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BaseSystemNode } from '@/components/nodes/BaseSystemNode';
import { SystemEdge } from '@/components/edges/SystemEdge';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { heroGraph, type HeroTemplateId } from './hero-templates';
import type { SystemEdge as SystemEdgeModel, SystemNode } from '@/types';

const nodeTypes = { system: BaseSystemNode };
const edgeTypes = { system: SystemEdge };
const FIT = { padding: 0.12, maxZoom: 1 };

/** Keep the diagram fitted when the window changes size. */
function FitOnResize({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const observer = new ResizeObserver(() => fitView(FIT));
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitView, target]);
  return null;
}

/**
 * Read-only React Flow canvas rendering a real template with the app's own node and
 * edge components. Nodes can be dragged with a mouse; touch scrolls the page instead.
 */
export function HeroCanvas({ templateId, narrow }: { templateId: HeroTemplateId; narrow: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const finePointer = useMediaQuery('(pointer: fine)');
  const { nodes, edges, edgesAt } = heroGraph(templateId, narrow ? 'TB' : 'LR');

  return (
    <div
      ref={ref}
      className="hero-flow absolute inset-0"
      style={{ '--edges-at': `${edgesAt}ms` } as CSSProperties}
    >
      <ReactFlowProvider>
        <ReactFlow<SystemNode, SystemEdgeModel>
          // Remount per template so the entry animation plays again.
          key={`${templateId}-${narrow ? 'tb' : 'lr'}`}
          defaultNodes={nodes}
          defaultEdges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={FIT}
          minZoom={0.2}
          nodesDraggable={finePointer}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          className="bg-transparent"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--dots)" />
          <FitOnResize target={ref} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
