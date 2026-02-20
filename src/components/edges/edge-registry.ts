import type { SystemEdgeType } from '@/types';

export interface EdgeTypeConfig {
  label: string;
  color: string;
  strokeDasharray?: string;
  animated: boolean;
}

export const EDGE_REGISTRY: Record<SystemEdgeType, EdgeTypeConfig> = {
  rest: {
    label: 'REST',
    color: '#3b82f6', // blue-500
    animated: false,
  },
  grpc: {
    label: 'gRPC',
    color: '#22c55e', // green-500
    animated: false,
  },
  websocket: {
    label: 'WebSocket',
    color: '#a855f7', // purple-500
    strokeDasharray: '5 5',
    animated: true,
  },
  'pub-sub': {
    label: 'Pub/Sub',
    color: '#ec4899', // pink-500
    strokeDasharray: '8 4',
    animated: true,
  },
  tcp: {
    label: 'TCP',
    color: '#6b7280', // gray-500
    animated: false,
  },
  'db-query': {
    label: 'DB Query',
    color: '#22c55e', // green-500
    strokeDasharray: '3 3',
    animated: false,
  },
};
