import type { SystemEdge, SystemNode } from '@/types';
import { getLayoutedElements } from './auto-layout';

export interface JsonImportItem {
  name: string;
  description: string;
  nodes: SystemNode[];
  edges: SystemEdge[];
  /** True when the file was an API endpoint list, not a saved project. */
  fromEndpoints: boolean;
}

interface RateLimit {
  max_rate?: number;
  client_max_rate?: number;
  every?: string;
  type?: string;
}

interface EndpointRecord {
  method: string;
  host: string;
  endpoint: string;
  backend: string;
  roles: string[];
  auth_enabled: boolean;
  rate?: RateLimit;
}

const LIST_KEYS = ['endpoint_list', 'endpoints', 'endpointList'] as const;
const ACRONYMS = new Set(['api', 'bff', 'cdn', 'db', 'http', 'https', 'ip', 'otp', 'sms', 'waf']);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function titleCase(value: string): string {
  return value
    .replace(/[-_./]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (ACRONYMS.has(word.toLowerCase())) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'node';
}

/** Turn `card_endpoints.json` into a project title. */
export function titleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.(json|ya?ml)$/i, '');
  return titleCase(base) || 'Imported project';
}

function looksLikeEndpoint(value: unknown): boolean {
  const rec = asRecord(value);
  if (!rec) return false;
  return (
    typeof rec.method === 'string' ||
    typeof rec.endpoint === 'string' ||
    typeof rec.backend === 'string' ||
    typeof rec.host === 'string'
  );
}

function parseRate(value: unknown): RateLimit | undefined {
  const rec = asRecord(value);
  if (!rec) return undefined;
  const rate: RateLimit = {};
  if (typeof rec.max_rate === 'number') rate.max_rate = rec.max_rate;
  if (typeof rec.client_max_rate === 'number') rate.client_max_rate = rec.client_max_rate;
  if (typeof rec.every === 'string') rate.every = rec.every;
  if (typeof rec.type === 'string') rate.type = rec.type;
  return Object.keys(rate).length > 0 ? rate : undefined;
}

/** Endpoint-list JSON, or null when the document is some other shape. Throws when the shape is right but the entries are not. */
function readEndpointList(data: unknown): EndpointRecord[] | null {
  let list: unknown[] | null = null;
  if (Array.isArray(data)) {
    if (data.length === 0 || !data.some(looksLikeEndpoint)) return null;
    list = data;
  } else {
    const rec = asRecord(data);
    if (!rec) return null;
    for (const key of LIST_KEYS) {
      if (!(key in rec)) continue;
      if (!Array.isArray(rec[key])) throw new Error(`"${key}" must be an array of endpoints.`);
      list = rec[key] as unknown[];
      break;
    }
    if (!list) return null;
  }

  if (list.length === 0) throw new Error('The file has no endpoints in it.');

  return list.map((item, index) => {
    const rec = asRecord(item);
    const where = `Endpoint ${index + 1}`;
    if (!rec || typeof rec.method !== 'string' || typeof rec.endpoint !== 'string') {
      throw new Error(`${where} needs a method and an endpoint path.`);
    }
    const method = rec.method.trim().toUpperCase();
    const endpoint = rec.endpoint.trim();
    if (!method || !endpoint) throw new Error(`${where} needs a method and an endpoint path.`);
    return {
      method,
      host: typeof rec.host === 'string' ? rec.host.trim() : '',
      endpoint,
      backend: typeof rec.backend === 'string' ? rec.backend.trim() : '',
      roles: Array.isArray(rec.roles) ? rec.roles.filter((role): role is string => typeof role === 'string') : [],
      auth_enabled: rec.auth_enabled === true,
      rate: parseRate(rec.rate),
    };
  });
}

/** Service boundary: the backend's first path segment, or the resource segment of a public path. */
function resourceKey(endpoint: EndpointRecord): string {
  const source = endpoint.backend || endpoint.endpoint;
  const segments = source
    .split('/')
    .filter((part) => part && !part.includes('{') && !/^v\d+$/i.test(part) && part.toLowerCase() !== 'api');
  if (segments.length === 0) return 'service';
  if (endpoint.backend) return segments[0];
  if (segments.length >= 3) return segments[segments.length - 2];
  return segments[segments.length - 1];
}

function hostStem(host: string): string {
  return host.replace(/\{[^}]+\}\.?/g, '').replace(/^\.+/, '').trim();
}

function hostLabel(host: string): string {
  return titleCase(hostStem(host) || host || 'api gateway') || 'API Gateway';
}

function formatRate(rate: RateLimit | undefined): string {
  if (!rate) return '';
  const every = rate.every ? `/${rate.every}` : '';
  const scope = rate.type ? ` per ${rate.type}` : '';
  const parts: string[] = [];
  if (typeof rate.client_max_rate === 'number') parts.push(`${rate.client_max_rate}${every}${scope}`);
  if (typeof rate.max_rate === 'number' && rate.max_rate !== rate.client_max_rate) {
    parts.push(`max ${rate.max_rate}${every}`);
  }
  return parts.join(', ');
}

function routeLine(endpoint: EndpointRecord): string {
  const target = endpoint.backend && endpoint.backend !== endpoint.endpoint ? ` → ${endpoint.backend}` : '';
  const rate = formatRate(endpoint.rate);
  return `${endpoint.method} ${endpoint.endpoint}${target}${rate ? ` · ${rate}` : ''}`;
}

function sharedRate(endpoints: EndpointRecord[]): string {
  const rates = endpoints.map((endpoint) => formatRate(endpoint.rate));
  if (rates.some((rate) => !rate) || new Set(rates).size !== 1) return '';
  return rates[0];
}

function endpointDiagram(endpoints: EndpointRecord[]): JsonImportItem {
  const hosts = [...new Set(endpoints.map((endpoint) => endpoint.host || ''))];
  const clientId = 'ep-client';
  const nodes: SystemNode[] = [
    {
      id: clientId,
      type: 'system',
      position: { x: 0, y: 0 },
      data: { label: 'Clients', nodeType: 'client', description: '', techStack: [] },
    },
  ];
  const edges: SystemEdge[] = [];

  hosts.forEach((host) => {
    const gatewayId = `ep-gw-${slug(hostStem(host) || host || 'gateway')}`;
    const hostEndpoints = endpoints.filter((endpoint) => (endpoint.host || '') === host);
    const groups = new Map<string, EndpointRecord[]>();
    for (const endpoint of hostEndpoints) {
      const key = resourceKey(endpoint);
      const group = groups.get(key);
      if (group) group.push(endpoint);
      else groups.set(key, [endpoint]);
    }

    nodes.push({
      id: gatewayId,
      type: 'system',
      position: { x: 0, y: 0 },
      data: {
        label: hostLabel(host),
        nodeType: 'api-gateway',
        description: [host, `${hostEndpoints.length} routes`].filter(Boolean).join('\n'),
        techStack: [],
      },
    });
    edges.push({
      id: `ep-edge-client-${gatewayId}`,
      source: clientId,
      target: gatewayId,
      type: 'system',
      data: { edgeType: 'rest', label: 'HTTPS' },
    });

    for (const [key, group] of groups) {
      const serviceId = `ep-svc-${slug(hostStem(host) || host || 'gateway')}-${slug(key)}`;
      const lines = group.map(routeLine);
      const roles = [...new Set(group.flatMap((endpoint) => endpoint.roles))];
      const auth = group.every((endpoint) => endpoint.auth_enabled)
        ? 'Auth required'
        : group.some((endpoint) => endpoint.auth_enabled)
          ? 'Mixed auth'
          : '';
      const meta = [auth, roles.length > 0 ? `Roles: ${roles.join(', ')}` : ''].filter(Boolean);
      nodes.push({
        id: serviceId,
        type: 'system',
        position: { x: 0, y: 0 },
        data: {
          label: titleCase(key),
          nodeType: 'service',
          description: [...lines, ...meta].join('\n'),
          techStack: [],
        },
      });
      const rate = sharedRate(group);
      edges.push({
        id: `ep-edge-${gatewayId}-${serviceId}`,
        source: gatewayId,
        target: serviceId,
        type: 'system',
        data: {
          edgeType: 'rest',
          label: group.length === 1 ? `${group[0].method} ${group[0].backend || group[0].endpoint}` : `${group.length} routes`,
          description: lines.join('\n'),
          ...(rate ? { throughput: rate } : {}),
        },
      });
    }
  });

  const hostNames = hosts.map((host) => hostLabel(host)).filter((name) => name !== 'API Gateway');
  const layout = getLayoutedElements(nodes, edges, 'LR');
  return {
    name: hostNames.length === 1 ? hostNames[0] : 'API endpoints',
    description: `${endpoints.length} endpoints${hostNames.length > 0 ? ` · ${hostNames.join(', ')}` : ''}`,
    nodes: layout.nodes,
    edges: layout.edges,
    fromEndpoints: true,
  };
}

function isProjectLike(value: unknown): value is { name?: string; description?: string; nodes: SystemNode[]; edges: SystemEdge[] } {
  const rec = asRecord(value);
  return !!rec && Array.isArray(rec.nodes) && Array.isArray(rec.edges);
}

function projectItem(value: { name?: string; description?: string; nodes: SystemNode[]; edges: SystemEdge[] }): JsonImportItem {
  return {
    name: typeof value.name === 'string' && value.name.trim() ? value.name : 'Imported project',
    description: typeof value.description === 'string' ? value.description : '',
    nodes: value.nodes,
    edges: value.edges,
    fromEndpoints: false,
  };
}

/**
 * Read a JSON import: a saved project, a `{ projects: [] }` backup, or an API
 * endpoint list (`endpoint_list` / `endpoints`).
 */
export function parseJsonImport(text: string): JsonImportItem[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`Not valid JSON: ${error instanceof Error ? error.message : 'parse error'}`);
  }

  const endpoints = readEndpointList(data);
  if (endpoints) return [endpointDiagram(endpoints)];

  const rec = asRecord(data);
  if (rec && Array.isArray(rec.projects)) {
    const list = rec.projects.filter(isProjectLike);
    if (list.length === 0) throw new Error('The file has no projects in it.');
    return list.map(projectItem);
  }
  if (isProjectLike(data)) return [projectItem(data)];
  throw new Error('Not a System Design Canvas project or an endpoint list.');
}
