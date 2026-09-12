'use client';

import { memo, useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useStore,
  type EdgeProps,
} from '@xyflow/react';
import { Pencil, Trash2 } from 'lucide-react';
import { EDGE_REGISTRY, edgeAnimationClass } from './edge-registry';
import { ProtocolMenu, ProtocolMenuItem, ProtocolMenuSeparator } from './ProtocolPicker';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useIsNarrow } from '@/hooks/useMediaQuery';
import { cn, edgeStroke } from '@/lib/utils';
import type { SystemEdge as SystemEdgeModel, SystemEdgeType } from '@/types';

/** Half the label pill's height: 14px line + 2px padding ×2 + 1px border ×2. */
const PILL_HALF = 10;
/** Meta line under the pill: 14px line + 2px gap. */
const META_HEIGHT = 16;

function SystemEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
  markerStart,
  markerEnd,
  interactionWidth,
}: EdgeProps<SystemEdgeModel>) {
  const edgeType = data?.edgeType ?? 'rest';
  const config = EDGE_REGISTRY[edgeType] ?? EDGE_REGISTRY.rest;
  const isStoreSelected = useCanvasStore((s) => s.selectedEdgeId === id);
  const presenting = useCanvasStore((s) => s.presentation.active);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // Set once an edit is committed or cancelled, so a trailing blur doesn't commit again.
  const editDone = useRef(true);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isSelected = !!selected || isStoreSelected;
  const label = data?.label || config.label;
  const meta = [data?.latency, data?.dataFormat, data?.throughput].filter(Boolean).join(' · ');

  const startEditing = () => {
    if (presenting) return;
    editDone.current = false;
    setDraft(data?.label ?? '');
    setEditing(true);
  };

  const finishEditing = (commit: boolean) => {
    if (editDone.current) return;
    editDone.current = true;
    setEditing(false);
    const next = draft.trim();
    if (commit && next !== (data?.label ?? '')) updateEdgeData(id, { label: next });
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
        className={edgeAnimationClass(config)}
        style={{
          ...style,
          stroke: isSelected ? 'var(--accent)' : edgeStroke(config.color),
          strokeWidth: isSelected ? 2.5 : 1.75,
          strokeLinecap: 'round',
          strokeDasharray: config.strokeDasharray,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute top-0 left-0 transition-opacity duration-200 motion-reduce:transition-none"
          style={{
            transform: `translate(${labelX}px, ${labelY}px)`,
            pointerEvents: presenting ? 'none' : 'all',
            opacity: style?.opacity,
            zIndex: isSelected ? 1100 : undefined,
          }}
        >
          <div
            className={cn(
              'nodrag nopan absolute top-0 left-0 cursor-pointer rounded-full border px-[9px] py-0.5 text-[10.5px] leading-[14px] font-medium whitespace-nowrap shadow-[var(--shadow)] transition-colors duration-[120ms]',
              isSelected ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-paper text-ink-2'
            )}
            style={{ transform: 'translate(-50%, -50%)' }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEdgeId(id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditing();
            }}
          >
            {editing ? (
              <input
                autoFocus
                aria-label="Connection label"
                value={draft}
                placeholder={config.label}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => finishEditing(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditing(true);
                  else if (e.key === 'Escape') finishEditing(false);
                  // Keep ⌫ / ⇧R etc. from reaching the canvas shortcuts.
                  e.stopPropagation();
                }}
                className="block bg-transparent p-0 text-[10.5px] leading-[14px] font-medium text-inherit outline-none placeholder:text-[color-mix(in_oklch,var(--accent-ink)_60%,transparent)]"
                style={{ width: `${Math.max(draft.length, config.label.length, 4) + 1}ch` }}
              />
            ) : (
              label
            )}
          </div>
          {meta && (
            <div
              className="pointer-events-none absolute left-0 rounded-[4px] bg-[color-mix(in_oklch,var(--bg)_85%,transparent)] px-1 font-mono text-[10px] leading-[14px] whitespace-nowrap text-ink-3"
              style={{ top: PILL_HALF + 2, transform: 'translateX(-50%)' }}
            >
              {meta}
            </div>
          )}
          {isSelected && !presenting && !editing && (
            <EdgeProtocolMenu
              edgeId={id}
              edgeType={edgeType}
              top={PILL_HALF + (meta ? META_HEIGHT : 0)}
              onEditLabel={startEditing}
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/** Inline protocol picker under the selected edge's label, kept at screen size. */
function EdgeProtocolMenu({
  edgeId,
  edgeType,
  top,
  onEditLabel,
}: {
  edgeId: string;
  edgeType: SystemEdgeType;
  top: number;
  onEditLabel: () => void;
}) {
  const zoom = useStore((s) => s.transform[2]);
  const isNarrow = useIsNarrow();
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);

  // On narrow screens the edge editor drawer covers this; it has the same controls.
  if (isNarrow) return null;

  return (
    <div
      className="nodrag nopan nowheel animate-fade-in absolute left-0 pt-3"
      style={{ top, transform: `scale(${1 / zoom}) translateX(-50%)`, transformOrigin: '0 0' }}
    >
      <ProtocolMenu
        value={edgeType}
        onSelect={(type) => {
          if (type !== edgeType) updateEdgeData(edgeId, { edgeType: type });
        }}
      >
        <ProtocolMenuSeparator />
        <ProtocolMenuItem icon={<Pencil />} onClick={onEditLabel}>
          Edit label
        </ProtocolMenuItem>
        <ProtocolMenuItem icon={<Trash2 />} danger onClick={() => deleteEdge(edgeId)}>
          Remove
        </ProtocolMenuItem>
      </ProtocolMenu>
    </div>
  );
}

export const SystemEdge = memo(SystemEdgeComponent);
