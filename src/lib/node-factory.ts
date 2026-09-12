import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import type { SystemNode, SystemNodeData, SystemNodeType } from '@/types';

let counter = 0;

function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

/** New component node (or group) of the given type at a flow position. */
export function createSystemNode(nodeType: SystemNodeType, position: { x: number; y: number }): SystemNode {
  const config = NODE_REGISTRY[nodeType];
  const isGroup = nodeType === 'group';
  const data: SystemNodeData = {
    label: isGroup ? 'Group' : config.label,
    nodeType,
    description: '',
    techStack: [...config.defaultTechStack],
  };
  return {
    id: nextId(isGroup ? 'group' : 'node'),
    type: isGroup ? 'group' : 'system',
    position,
    ...(isGroup ? { style: { width: 320, height: 200 } } : {}),
    data,
  };
}

/** New sticky note at a flow position. */
export function createNoteNode(position: { x: number; y: number }): SystemNode {
  return {
    id: nextId('note'),
    type: 'note',
    position,
    data: { label: '', nodeType: 'service', description: '', techStack: [] },
  };
}
