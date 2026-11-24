import {
  NODE_ENVIRONMENTS,
  NODE_STATUSES,
  SYSTEM_EDGE_TYPES,
  SYSTEM_NODE_TYPES,
  type NodeEnvironment,
  type NodeStatus,
  type SystemEdge,
  type SystemEdgeData,
  type SystemEdgeType,
  type SystemNode,
  type SystemNodeData,
  type SystemNodeType,
} from '@/types';
import { getLayoutedElements, orientEdgeHandles } from './auto-layout';
import { getNodeRect, type Rect } from './minimap';

/**
 * `sdc/design@1`: a design with everything an LLM gets wrong left out (positions,
 * handles, sizes). "Edit with AI" copies it into a prompt and reads the answer back;
 * the app itself never calls a model.
 */
export const DESIGN_FORMAT = 'sdc/design@1';
export const MAX_DESIGN_NODES = 200;
export const MAX_DESIGN_EDGES = 400;

type ComponentType = Exclude<SystemNodeType, 'group'>;

export interface DesignNode {
  id: string;
  type: ComponentType;
  label: string;
  tech: string[];
  description?: string;
  story?: string;
  status?: NodeStatus;
  environment?: NodeEnvironment;
  owner?: string;
  links?: { label: string; url: string }[];
}

export interface DesignEdge {
  from: string;
  to: string;
  protocol: SystemEdgeType;
  label?: string;
  description?: string;
  latency?: string;
  dataFormat?: string;
  throughput?: string;
}

export interface Design {
  format: typeof DESIGN_FORMAT;
  nodes: DesignNode[];
  edges: DesignEdge[];
}

const COMPONENT_HINTS: Record<ComponentType, string> = {
  client: 'browser, mobile app or other caller',
  cdn: 'content delivery network',
  dns: 'DNS',
  waf: 'web application firewall',
  'load-balancer': 'load balancer',
  'api-gateway': 'API gateway',
  service: 'application service',
  worker: 'background worker',
  serverless: 'serverless function',
  'container-cluster': 'container cluster, e.g. Kubernetes',
  database: 'database',
  cache: 'cache',
  'object-storage': 'object / blob storage',
  'search-index': 'search index',
  queue: 'message queue',
  stream: 'event stream, e.g. Kafka',
  scheduler: 'scheduler / cron',
  logging: 'log pipeline',
  monitoring: 'metrics and alerting',
};

const PROTOCOL_HINTS: Record<SystemEdgeType, string> = {
  rest: 'REST / plain HTTP',
  grpc: 'gRPC',
  graphql: 'GraphQL',
  websocket: 'WebSocket',
  'pub-sub': 'publish / subscribe',
  mqtt: 'MQTT',
  'event-stream': 'server-sent events or a stream consumer',
  tcp: 'raw TCP',
  'db-query': 'database or cache query',
};

const COMPONENT_TYPES = SYSTEM_NODE_TYPES.filter((type): type is ComponentType => type !== 'group');

const TYPE_ALIASES: Record<string, ComponentType> = {
  lb: 'load-balancer',
  gateway: 'api-gateway',
  db: 'database',
  storage: 'object-storage',
  search: 'search-index',
  function: 'serverless',
  lambda: 'serverless',
  kubernetes: 'container-cluster',
  cluster: 'container-cluster',
};

const PROTOCOL_ALIASES: Record<string, SystemEdgeType> = {
  http: 'rest',
  https: 'rest',
  ws: 'websocket',
  pubsub: 'pub-sub',
  sse: 'event-stream',
  sql: 'db-query',
  db: 'db-query',
};

const NODE_TEXT_FIELDS = ['description', 'story', 'owner'] as const;
const EDGE_TEXT_FIELDS = ['label', 'description', 'latency', 'dataFormat', 'throughput'] as const;

/** Groups and sticky notes are layout aids: they stay out of the prompt and are never touched. */
function isComponent(node: SystemNode) {
  return node.type !== 'group' && node.type !== 'note';
}

function toDesignNode(node: SystemNode): DesignNode {
  const data = node.data;
  const out: DesignNode = {
    id: node.id,
    type: data.nodeType as ComponentType,
    label: data.label,
    tech: [...(data.techStack ?? [])],
  };
  for (const field of NODE_TEXT_FIELDS) {
    if (data[field]) out[field] = data[field];
  }
  if (data.status) out.status = data.status;
  if (data.environment) out.environment = data.environment;
  if (data.links && data.links.length > 0) out.links = data.links.map((link) => ({ label: link.label, url: link.url }));
  return out;
}

function toDesignEdge(edge: SystemEdge): DesignEdge {
  const data = edge.data;
  const out: DesignEdge = { from: edge.source, to: edge.target, protocol: data?.edgeType ?? 'rest' };
  for (const field of EDGE_TEXT_FIELDS) {
    if (data?.[field]) out[field] = data[field];
  }
  return out;
}

/** The canvas as a design: components and the connections between them. */
export function toDesign(nodes: SystemNode[], edges: SystemEdge[]): Design {
  const components = nodes.filter(isComponent);
  const ids = new Set(components.map((node) => node.id));
  return {
    format: DESIGN_FORMAT,
    nodes: components.map(toDesignNode),
    edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)).map(toDesignEdge),
  };
}

// ── Reading an answer ──

export type ParseResult = { ok: true; design: Design } | { ok: false; errors: string[] };

const MAX_ERRORS = 6;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Pull the design object out of a chat answer: a fenced block, or the outermost braces. */
function extractJson(text: string): { value: Record<string, unknown> } | { error: string } {
  const candidates: string[] = [];
  for (const match of text.matchAll(/```[a-zA-Z0-9]*\s*\n([\s\S]*?)```/g)) candidates.push(match[1]);
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));

  if (candidates.length === 0) return { error: 'No JSON found. Paste the whole answer, including the JSON block.' };

  let parseError = '';
  for (const candidate of candidates) {
    try {
      const value = asRecord(JSON.parse(candidate));
      if (value && Array.isArray(value.nodes)) return { value };
    } catch (error) {
      parseError ||= error instanceof Error ? error.message : 'parse error';
    }
  }
  return {
    error: parseError
      ? `The JSON is not valid: ${parseError}`
      : 'The JSON has no "nodes" list. It should look like { "format": "sdc/design@1", "nodes": [...], "edges": [...] }.',
  };
}

function text(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[_\s]+/g, '-') : '';
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  const key = normalize(value);
  return allowed.find((item) => item === key);
}

function readLinks(value: unknown, where: string, errors: string[]): DesignNode['links'] {
  if (!Array.isArray(value)) return undefined;
  const links: { label: string; url: string }[] = [];
  for (const item of value) {
    const url = text(asRecord(item)?.url);
    if (!url) continue;
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1].toLowerCase();
    if (scheme && scheme !== 'http' && scheme !== 'https' && scheme !== 'mailto') {
      errors.push(`${where}: link "${url}" must start with http://, https:// or mailto:.`);
      continue;
    }
    links.push({ label: text(asRecord(item)?.label) ?? 'Link', url });
  }
  return links.length > 0 ? links : undefined;
}

/** Read a pasted answer. Tolerant about wrapping and spelling, strict about what ends up on the canvas. */
export function parseDesign(input: string): ParseResult {
  const extracted = extractJson(input);
  if ('error' in extracted) return { ok: false, errors: [extracted.error] };
  const raw = extracted.value;
  const errors: string[] = [];

  const rawNodes = raw.nodes as unknown[];
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];
  if (raw.edges !== undefined && !Array.isArray(raw.edges)) errors.push('"edges" must be a list.');
  if (rawNodes.length > MAX_DESIGN_NODES) errors.push(`Too many nodes: ${rawNodes.length} (the limit is ${MAX_DESIGN_NODES}).`);
  if (rawEdges.length > MAX_DESIGN_EDGES) errors.push(`Too many edges: ${rawEdges.length} (the limit is ${MAX_DESIGN_EDGES}).`);
  if (errors.length > 0) return { ok: false, errors };

  const nodes: DesignNode[] = [];
  const ids = new Set<string>();
  rawNodes.forEach((item, index) => {
    const rec = asRecord(item);
    const id = text(rec?.id);
    const label = text(rec?.label) ?? text(rec?.name);
    const where = `Node ${index + 1}${label ? ` ("${label}")` : id ? ` ("${id}")` : ''}`;
    if (!rec || !id) {
      errors.push(`${where}: needs an "id".`);
      return;
    }
    if (ids.has(id)) {
      errors.push(`${where}: the id "${id}" is used twice.`);
      return;
    }
    ids.add(id);
    if (!label) errors.push(`${where}: needs a "label".`);
    const type = oneOf(rec.type, COMPONENT_TYPES) ?? TYPE_ALIASES[normalize(rec.type)];
    if (!type) {
      errors.push(`${where}: type "${String(rec.type ?? '')}" is not a component type. Use one of: ${COMPONENT_TYPES.join(', ')}.`);
    }
    if (!label || !type) return;

    const tech = Array.isArray(rec.tech) ? rec.tech.map(text).filter((item): item is string => !!item) : [text(rec.tech)].filter((item): item is string => !!item);
    const node: DesignNode = { id, type, label, tech };
    for (const field of NODE_TEXT_FIELDS) {
      const value = text(rec[field]);
      if (value) node[field] = value;
    }
    const status = oneOf(rec.status, NODE_STATUSES);
    if (status) node.status = status;
    const environment = oneOf(rec.environment, NODE_ENVIRONMENTS);
    if (environment) node.environment = environment;
    const links = readLinks(rec.links, where, errors);
    if (links) node.links = links;
    nodes.push(node);
  });

  const edges: DesignEdge[] = [];
  const seen = new Set<string>();
  rawEdges.forEach((item, index) => {
    const rec = asRecord(item);
    const from = text(rec?.from) ?? text(rec?.source);
    const to = text(rec?.to) ?? text(rec?.target);
    const where = `Edge ${index + 1}${from && to ? ` (${from} → ${to})` : ''}`;
    if (!rec || !from || !to) {
      errors.push(`${where}: needs "from" and "to".`);
      return;
    }
    if (from === to) {
      errors.push(`${where}: connects a node to itself.`);
      return;
    }
    const missing = [from, to].filter((id) => !ids.has(id));
    if (missing.length > 0) {
      errors.push(`${where}: there is no node with the id "${missing[0]}".`);
      return;
    }
    const protocol = rec.protocol === undefined ? 'rest' : (oneOf(rec.protocol, SYSTEM_EDGE_TYPES) ?? PROTOCOL_ALIASES[normalize(rec.protocol)]);
    if (!protocol) {
      errors.push(`${where}: protocol "${String(rec.protocol)}" is not known. Use one of: ${SYSTEM_EDGE_TYPES.join(', ')}.`);
      return;
    }
    const key = `${from}\n${to}\n${protocol}`;
    if (seen.has(key)) return;
    seen.add(key);
    const edge: DesignEdge = { from, to, protocol };
    for (const field of EDGE_TEXT_FIELDS) {
      const value = text(rec[field]);
      if (value) edge[field] = value;
    }
    edges.push(edge);
  });

  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_ERRORS);
    if (errors.length > MAX_ERRORS) shown.push(`…and ${errors.length - MAX_ERRORS} more.`);
    return { ok: false, errors: shown };
  }
  return { ok: true, design: { format: DESIGN_FORMAT, nodes, edges } };
}

// ── Applying a design ──

export interface DesignDiff {
  addedNodes: string[];
  removedNodes: string[];
  changedNodes: { label: string; fields: string[] }[];
  addedEdges: string[];
  removedEdges: string[];
  changedEdges: string[];
  /** Most components are new, so the whole canvas is laid out again. */
  relayout: boolean;
  empty: boolean;
}

export interface DesignPlan {
  nodes: SystemNode[];
  edges: SystemEdge[];
  diff: DesignDiff;
}

const NODE_GAP_X = 72;
const NODE_GAP_Y = 96;
const CLEARANCE = 24;

function nodeData(node: DesignNode): SystemNodeData {
  const data: SystemNodeData = {
    label: node.label,
    nodeType: node.type,
    description: node.description ?? '',
    techStack: [...node.tech],
  };
  if (node.story) data.story = node.story;
  if (node.status) data.status = node.status;
  if (node.environment) data.environment = node.environment;
  if (node.owner) data.owner = node.owner;
  if (node.links) data.links = node.links.map((link) => ({ ...link }));
  return data;
}

function edgeData(edge: DesignEdge): SystemEdgeData {
  const data: SystemEdgeData = { edgeType: edge.protocol, label: edge.label ?? '' };
  for (const field of EDGE_TEXT_FIELDS) {
    if (field !== 'label' && edge[field]) data[field] = edge[field];
  }
  return data;
}

function changedFields<T extends object>(before: T, after: T, skip: string[]): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter(
    (key) =>
      !skip.includes(key) &&
      JSON.stringify((before as Record<string, unknown>)[key]) !== JSON.stringify((after as Record<string, unknown>)[key])
  );
}

function tooClose(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width + CLEARANCE &&
    b.x < a.x + a.width + CLEARANCE &&
    a.y < b.y + b.height + CLEARANCE &&
    b.y < a.y + a.height + CLEARANCE
  );
}

/**
 * Put new components next to what they connect to, leaving every existing node where
 * the user placed it. The offset from the neighbour comes from a throwaway dagre pass.
 */
function placeAdded(nodes: SystemNode[], edges: SystemEdge[], addedIds: Set<string>): SystemNode[] {
  const ideal = new Map(getLayoutedElements(nodes, edges).nodes.map((node) => [node.id, node.position]));
  const placed = new Map<string, SystemNode>();
  for (const node of nodes) {
    if (isComponent(node) && !addedIds.has(node.id)) placed.set(node.id, node);
  }

  for (const node of nodes) {
    if (!addedIds.has(node.id)) continue;
    const link = edges.find(
      (edge) => (edge.source === node.id && placed.has(edge.target)) || (edge.target === node.id && placed.has(edge.source))
    );
    const anchor = link ? placed.get(link.source === node.id ? link.target : link.source) : undefined;
    const position = { x: 0, y: 0 };
    const own = ideal.get(node.id);
    const anchorIdeal = anchor && ideal.get(anchor.id);
    if (anchor && own && anchorIdeal) {
      position.x = anchor.position.x + own.x - anchorIdeal.x;
      position.y = anchor.position.y + own.y - anchorIdeal.y;
    } else if (placed.size > 0) {
      const rects = [...placed.values()].map(getNodeRect);
      position.x = Math.min(...rects.map((rect) => rect.x));
      position.y = Math.max(...rects.map((rect) => rect.y + rect.height)) + NODE_GAP_Y;
    }

    let candidate: SystemNode = { ...node, position };
    const others = [...placed.values()].map(getNodeRect);
    for (let tries = 0; tries < 60 && others.some((rect) => tooClose(getNodeRect(candidate), rect)); tries += 1) {
      const rect = getNodeRect(candidate);
      candidate = { ...candidate, position: { x: rect.x + rect.width + NODE_GAP_X, y: rect.y } };
    }
    placed.set(node.id, candidate);
  }

  return nodes.map((node) => placed.get(node.id) ?? node);
}

/**
 * Work out the canvas a design would produce and what changes on the way. Nodes are
 * matched by id (position, size, lock and order are kept), connections by endpoints.
 */
export function planDesign(design: Design, nodes: SystemNode[], edges: SystemEdge[]): DesignPlan {
  const current = new Map(nodes.filter(isComponent).map((node) => [node.id, node]));
  const taken = new Set(nodes.filter((node) => !isComponent(node)).map((node) => node.id));
  const designIds = new Set(design.nodes.map((node) => node.id));

  // A new id that collides with a group or note is renamed rather than refused.
  const rename = new Map<string, string>();
  for (const node of design.nodes) {
    let id = node.id;
    while (taken.has(id) || (id !== node.id && designIds.has(id))) id = `${id}-ai`;
    if (id !== node.id) {
      rename.set(node.id, id);
      taken.add(id);
    }
  }
  const resolve = (id: string) => rename.get(id) ?? id;

  const diff: DesignDiff = {
    addedNodes: [],
    removedNodes: [],
    changedNodes: [],
    addedEdges: [],
    removedEdges: [],
    changedEdges: [],
    relayout: false,
    empty: false,
  };

  const labels = new Map<string, string>();
  const updated = new Map<string, SystemNode>();
  const added: SystemNode[] = [];
  for (const node of design.nodes) {
    const id = resolve(node.id);
    labels.set(id, node.label);
    const existing = current.get(id);
    if (!existing) {
      added.push({ id, type: 'system', position: { x: 0, y: 0 }, data: nodeData(node) });
      diff.addedNodes.push(node.label);
      continue;
    }
    const fields = changedFields(toDesignNode(existing), node, ['id']);
    if (fields.length === 0) {
      updated.set(id, existing);
    } else {
      updated.set(id, { ...existing, data: nodeData(node) });
      diff.changedNodes.push({ label: node.label, fields });
    }
  }
  for (const [id, node] of current) {
    labels.set(id, labels.get(id) ?? node.data.label);
    if (!updated.has(id)) diff.removedNodes.push(node.data.label);
  }

  let nextNodes: SystemNode[] = [
    ...nodes.flatMap((node) => (isComponent(node) ? (updated.get(node.id) ?? []) : [node])),
    ...added,
  ];
  const nextIds = new Set(nextNodes.map((node) => node.id));

  const describe = (edge: DesignEdge) =>
    `${labels.get(resolve(edge.from)) ?? edge.from} → ${labels.get(resolve(edge.to)) ?? edge.to} · ${edge.protocol}`;

  // Connections that involve a group or note are not part of the design; keep them.
  const untouched: SystemEdge[] = [];
  const pool = new Map<string, SystemEdge[]>();
  for (const edge of edges) {
    if (current.has(edge.source) && current.has(edge.target)) {
      const key = `${edge.source}\n${edge.target}`;
      pool.set(key, [...(pool.get(key) ?? []), edge]);
    } else if (nextIds.has(edge.source) && nextIds.has(edge.target)) {
      untouched.push(edge);
    }
  }

  const freshIds = new Set<string>();
  const designEdges: SystemEdge[] = [];
  for (const edge of design.edges) {
    const source = resolve(edge.from);
    const target = resolve(edge.to);
    const candidates = pool.get(`${source}\n${target}`) ?? [];
    const sameProtocol = candidates.findIndex((item) => (item.data?.edgeType ?? 'rest') === edge.protocol);
    const [match] = candidates.splice(sameProtocol === -1 ? 0 : sameProtocol, 1);
    if (!match) {
      const id = crypto.randomUUID();
      freshIds.add(id);
      designEdges.push({ id, source, target, type: 'system', data: edgeData(edge) });
      diff.addedEdges.push(describe(edge));
      continue;
    }
    if (changedFields(toDesignEdge(match), edge, ['from', 'to']).length === 0) {
      designEdges.push(match);
    } else {
      designEdges.push({ ...match, data: edgeData(edge) });
      diff.changedEdges.push(describe(edge));
    }
  }
  for (const leftover of pool.values()) {
    for (const edge of leftover) diff.removedEdges.push(describe(toDesignEdge(edge)));
  }

  let nextEdges = [...designEdges, ...untouched];
  const addedIds = new Set(added.map((node) => node.id));
  diff.relayout = added.length > 0 && added.length > updated.size;

  if (diff.relayout) {
    const layouted = getLayoutedElements(nextNodes, nextEdges);
    nextNodes = layouted.nodes;
    nextEdges = layouted.edges;
  } else if (added.length > 0 || freshIds.size > 0) {
    if (added.length > 0) nextNodes = placeAdded(nextNodes, nextEdges, addedIds);
    // Only connections that are new get their handle sides picked; the rest keep the user's.
    const oriented = new Map(orientEdgeHandles(nextNodes, nextEdges).map((edge) => [edge.id, edge]));
    nextEdges = nextEdges.map((edge) => (freshIds.has(edge.id) ? (oriented.get(edge.id) ?? edge) : edge));
  }

  diff.empty =
    diff.addedNodes.length + diff.removedNodes.length + diff.changedNodes.length +
      diff.addedEdges.length + diff.removedEdges.length + diff.changedEdges.length === 0;

  return { nodes: nextNodes, edges: nextEdges, diff };
}

// ── The prompt ──

const EXAMPLE: Design = {
  format: DESIGN_FORMAT,
  nodes: [
    { id: 'web', type: 'client', label: 'Web app', tech: ['React'] },
    { id: 'api', type: 'service', label: 'API', tech: ['Node.js'], description: 'Handles all public requests.' },
    { id: 'db', type: 'database', label: 'Orders DB', tech: ['PostgreSQL'] },
  ],
  edges: [
    { from: 'web', to: 'api', protocol: 'rest', label: 'HTTPS' },
    { from: 'api', to: 'db', protocol: 'db-query', latency: '5 ms' },
  ],
};

function bullets<T extends string>(hints: Record<T, string>, order: readonly T[]) {
  return order.map((key) => `- \`${key}\`: ${hints[key]}`).join('\n');
}

/** How to write a design. The prompt and /llms-full.txt are both built from this. */
export const FORMAT_GUIDE = `## The ${DESIGN_FORMAT} format

A design is one JSON object:

\`\`\`json
${JSON.stringify(EXAMPLE, null, 2)}
\`\`\`

Rules:

- Always return the complete design, not a patch. A node or edge you leave out is deleted.
- Keep the \`id\` of every node you keep: the id is how the canvas remembers where the node sits.
- Give new nodes a short, unique, kebab-case \`id\`.
- Do not add positions, sizes, colours or any field not listed here. Layout is automatic.
- An edge goes \`from\` one node id \`to\` another. No edge from a node to itself.
- At most ${MAX_DESIGN_NODES} nodes and ${MAX_DESIGN_EDGES} edges.

Node fields: \`id\`, \`type\`, \`label\` and \`tech\` (a list of technology names, may be empty) are required.
Optional: \`description\` (one short sentence; the card shows two lines of it), \`story\` (longer
narration, shown in presentation mode), \`owner\`,
\`status\` (${NODE_STATUSES.join(' | ')}), \`environment\` (${NODE_ENVIRONMENTS.join(' | ')}),
\`links\` (a list of \`{ "label", "url" }\`, http(s) or mailto only).

Node \`type\` is one of:

${bullets(COMPONENT_HINTS, COMPONENT_TYPES)}

Edge fields: \`from\`, \`to\` and \`protocol\` are required.
Optional, all free text: \`label\`, \`description\`, \`latency\`, \`dataFormat\`, \`throughput\`.

Edge \`protocol\` is one of:

${bullets(PROTOCOL_HINTS, SYSTEM_EDGE_TYPES)}`;

/** The text "Copy prompt" puts on the clipboard. */
export function buildPrompt(design: Design, request: string): string {
  const ask = request.trim();
  return `You are editing a software architecture diagram made in System Design Canvas.

${FORMAT_GUIDE}

## Current design

\`\`\`json
${JSON.stringify(design, null, 2)}
\`\`\`

## Requested change

${ask || '(Describe the change you want here.)'}

Reply with one \`\`\`json code block that holds the complete updated design, followed by a short list of what you changed and why.
`;
}

/** Contents of /llms-full.txt. */
export function llmsFullText(): string {
  return `# System Design Canvas: design format

System Design Canvas is a browser canvas for software architecture diagrams. It runs
entirely in the browser and calls no AI model. To change a design with an AI, open a
canvas, choose "Edit with AI", copy the prompt, and paste the answer back: the app
checks it, shows what would change, and applies it only after you confirm.

This page is the format that prompt uses.

${FORMAT_GUIDE}
`;
}
