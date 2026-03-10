import { z } from 'zod';
import type { Node, Edge, Viewport } from '@xyflow/react';

// Node types
export const SYSTEM_NODE_TYPES = [
  'service',
  'database',
  'cache',
  'queue',
  'load-balancer',
  'client',
  'cdn',
  'api-gateway',
  'group',
  'dns',
  'waf',
  'worker',
  'serverless',
  'container-cluster',
  'object-storage',
  'search-index',
  'stream',
  'scheduler',
  'logging',
  'monitoring',
] as const;

export type SystemNodeType = (typeof SYSTEM_NODE_TYPES)[number];

// Edge types
export const SYSTEM_EDGE_TYPES = [
  'rest',
  'grpc',
  'graphql',
  'websocket',
  'pub-sub',
  'mqtt',
  'event-stream',
  'tcp',
  'db-query',
] as const;

export type SystemEdgeType = (typeof SYSTEM_EDGE_TYPES)[number];

// Node status & environment
export const NODE_STATUSES = ['operational', 'degraded', 'down', 'maintenance'] as const;
export type NodeStatus = (typeof NODE_STATUSES)[number];

export const NODE_ENVIRONMENTS = ['production', 'staging', 'development'] as const;
export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

// Node data
export const SystemNodeDataSchema = z.object({
  label: z.string(),
  nodeType: z.enum(SYSTEM_NODE_TYPES),
  description: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  status: z.enum(NODE_STATUSES).optional(),
  environment: z.enum(NODE_ENVIRONMENTS).optional(),
  owner: z.string().optional(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })).optional(),
});

export type SystemNodeData = z.infer<typeof SystemNodeDataSchema>;

// Edge data
export const SystemEdgeDataSchema = z.object({
  edgeType: z.enum(SYSTEM_EDGE_TYPES),
  label: z.string().optional(),
  description: z.string().optional(),
  latency: z.string().optional(),
  dataFormat: z.string().optional(),
  throughput: z.string().optional(),
});

export type SystemEdgeData = z.infer<typeof SystemEdgeDataSchema>;

// React Flow typed aliases
export type SystemNode = Node<SystemNodeData, string>;
export type SystemEdge = Edge<SystemEdgeData>;

// Project
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }).default({ x: 0, y: 0, zoom: 1 }),
});

export type Project = z.infer<typeof ProjectSchema>;

// App data (persisted)
export const AppDataSchema = z.object({
  version: z.number().default(1),
  projects: z.array(ProjectSchema).default([]),
  lastOpenedProjectId: z.string().nullable().default(null),
});

export type AppData = z.infer<typeof AppDataSchema>;

// Default viewport
export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
