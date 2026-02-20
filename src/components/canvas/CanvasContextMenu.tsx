'use client';

import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { NODE_REGISTRY, getNodesByCategory } from '@/components/nodes/node-registry';
import type { SystemNodeType, SystemNodeData } from '@/types';
import { Copy, Trash2, ClipboardPaste, Plus, Pencil } from 'lucide-react';

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  selectedCount?: number;
}

interface CanvasContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  hasClipboard: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDeleteSelection: () => void;
}

const categories = getNodesByCategory();

export function CanvasContextMenu({ menu, onClose, hasClipboard, onCopy, onPaste, onDeleteSelection }: CanvasContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useCanvasStore((s) => s.addNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);

  useEffect(() => {
    const handleClick = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleAddNode = (nodeType: SystemNodeType) => {
    const position = screenToFlowPosition({ x: menu.x, y: menu.y });
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
    onClose();
  };

  const handleDelete = () => {
    if (isMultiSelect) {
      onDeleteSelection();
    } else if (menu.nodeId) {
      deleteNode(menu.nodeId);
      setSelectedNodeId(null);
    }
    onClose();
  };

  const handleCopy = () => {
    onCopy();
    onClose();
  };

  const handlePaste = () => {
    onPaste();
    onClose();
  };

  const handleEdit = () => {
    if (menu.nodeId) setSelectedNodeId(menu.nodeId);
    onClose();
  };

  const handleDuplicate = () => {
    if (!menu.nodeId) return;
    const node = nodes.find((n) => n.id === menu.nodeId);
    if (!node) return;
    addNode({
      id: `node-${Date.now()}`,
      type: node.type,
      position: { x: node.position.x + 30, y: node.position.y + 30 },
      ...(node.type === 'group' ? { style: { width: 300, height: 200 } } : {}),
      data: { ...node.data },
    });
    onClose();
  };

  const isNodeMenu = !!menu.nodeId;
  const isMultiSelect = (menu.selectedCount ?? 0) > 1;

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-lg"
      style={{ left: menu.x, top: menu.y }}
    >
      {isNodeMenu ? (
        isMultiSelect ? (
          <>
            <MenuItem icon={Copy} label={`Copy ${menu.selectedCount} nodes`} onClick={handleCopy} shortcut="Ctrl+C" />
            <div className="my-1 h-px bg-border" />
            <MenuItem icon={Trash2} label={`Delete ${menu.selectedCount} nodes`} onClick={handleDelete} shortcut="Del" destructive />
          </>
        ) : (
          <>
            <MenuItem icon={Pencil} label="Edit" onClick={handleEdit} />
            <MenuItem icon={Copy} label="Copy" onClick={handleCopy} shortcut="Ctrl+C" />
            <MenuItem icon={Copy} label="Duplicate" onClick={handleDuplicate} />
            <div className="my-1 h-px bg-border" />
            <MenuItem icon={Trash2} label="Delete" onClick={handleDelete} shortcut="Del" destructive />
          </>
        )
      ) : (
        <>
          {hasClipboard && (
            <>
              <MenuItem icon={ClipboardPaste} label="Paste" onClick={handlePaste} shortcut="Ctrl+V" />
              <div className="my-1 h-px bg-border" />
            </>
          )}
          <AddNodeSubMenu onAdd={handleAddNode} />
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  shortcut,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  shortcut?: string;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-popover-foreground hover:bg-accent'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-xs text-muted-foreground">{shortcut}</span>}
    </button>
  );
}

function AddNodeSubMenu({ onAdd }: { onAdd: (type: SystemNodeType) => void }) {
  return (
    <>
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Add Node
        </div>
      </div>
      {categories.map(({ category, types }) => (
        <div key={category}>
          <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            {category}
          </div>
          <div className="grid grid-cols-2 gap-0.5 px-0.5">
            {types.map(({ type, config }) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => onAdd(type)}
                  className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-popover-foreground transition-colors hover:bg-accent"
                >
                  <Icon className={`h-3 w-3 shrink-0 ${config.color}`} />
                  <span className="truncate">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
