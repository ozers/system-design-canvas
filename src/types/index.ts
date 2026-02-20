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

// Node data
export const SystemNodeDataSchema = z.object({
  label: z.string(),
  nodeType: z.enum(SYSTEM_NODE_TYPES),
  description: z.string().optional(),
  techStack: z.array(z.string()).default([]),
});

export type SystemNodeData = z.infer<typeof SystemNodeDataSchema>;

// Edge data
export const SystemEdgeDataSchema = z.object({
  edgeType: z.enum(SYSTEM_EDGE_TYPES),
  label: z.string().optional(),
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
