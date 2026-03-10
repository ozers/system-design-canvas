import yaml from 'js-yaml';
import type { SystemNode, SystemEdge, SystemNodeType, SystemEdgeType } from '@/types';
import { getLayoutedElements } from './auto-layout';

// --- Image → Node type mapping ---

interface ImageMatch {
  patterns: string[];
  nodeType: SystemNodeType;
  techStack: string[];
  edgeType?: SystemEdgeType;
}

const IMAGE_MATCHERS: ImageMatch[] = [
  // Databases
  { patterns: ['postgres', 'pgsql'], nodeType: 'database', techStack: ['PostgreSQL'], edgeType: 'db-query' },
  { patterns: ['mysql', 'mariadb'], nodeType: 'database', techStack: ['MySQL'], edgeType: 'db-query' },
  { patterns: ['mongo'], nodeType: 'database', techStack: ['MongoDB'], edgeType: 'db-query' },
  { patterns: ['cassandra'], nodeType: 'database', techStack: ['Cassandra'], edgeType: 'db-query' },
  { patterns: ['couchdb', 'couchbase'], nodeType: 'database', techStack: ['CouchDB'], edgeType: 'db-query' },
  { patterns: ['dynamodb'], nodeType: 'database', techStack: ['DynamoDB'], edgeType: 'db-query' },
  { patterns: ['cockroach'], nodeType: 'database', techStack: ['CockroachDB'], edgeType: 'db-query' },
  { patterns: ['neo4j'], nodeType: 'database', techStack: ['Neo4j'], edgeType: 'db-query' },
  { patterns: ['influxdb'], nodeType: 'database', techStack: ['InfluxDB'], edgeType: 'db-query' },
  { patterns: ['clickhouse'], nodeType: 'database', techStack: ['ClickHouse'], edgeType: 'db-query' },

  // Cache
  { patterns: ['redis'], nodeType: 'cache', techStack: ['Redis'], edgeType: 'tcp' },
  { patterns: ['memcache'], nodeType: 'cache', techStack: ['Memcached'], edgeType: 'tcp' },
  { patterns: ['dragonfly'], nodeType: 'cache', techStack: ['Dragonfly'], edgeType: 'tcp' },
  { patterns: ['valkey'], nodeType: 'cache', techStack: ['Valkey'], edgeType: 'tcp' },

  // Message Queues
  { patterns: ['rabbitmq', 'rabbit'], nodeType: 'queue', techStack: ['RabbitMQ'], edgeType: 'pub-sub' },
  { patterns: ['kafka'], nodeType: 'stream', techStack: ['Kafka'], edgeType: 'pub-sub' },
  { patterns: ['nats'], nodeType: 'queue', techStack: ['NATS'], edgeType: 'pub-sub' },
  { patterns: ['activemq'], nodeType: 'queue', techStack: ['ActiveMQ'], edgeType: 'pub-sub' },
  { patterns: ['pulsar'], nodeType: 'stream', techStack: ['Pulsar'], edgeType: 'pub-sub' },

  // Load Balancers / Reverse Proxy
  { patterns: ['nginx'], nodeType: 'load-balancer', techStack: ['Nginx'] },
  { patterns: ['haproxy'], nodeType: 'load-balancer', techStack: ['HAProxy'] },
  { patterns: ['traefik'], nodeType: 'load-balancer', techStack: ['Traefik'] },
  { patterns: ['caddy'], nodeType: 'load-balancer', techStack: ['Caddy'] },
  { patterns: ['envoy'], nodeType: 'load-balancer', techStack: ['Envoy'] },
  { patterns: ['kong'], nodeType: 'api-gateway', techStack: ['Kong'] },

  // Search
  { patterns: ['elasticsearch', 'opensearch'], nodeType: 'search-index', techStack: ['Elasticsearch'] },
  { patterns: ['meilisearch'], nodeType: 'search-index', techStack: ['Meilisearch'] },
  { patterns: ['typesense'], nodeType: 'search-index', techStack: ['Typesense'] },
  { patterns: ['solr'], nodeType: 'search-index', techStack: ['Solr'] },

  // Object Storage
  { patterns: ['minio'], nodeType: 'object-storage', techStack: ['MinIO'] },

  // Monitoring / Logging
  { patterns: ['prometheus'], nodeType: 'monitoring', techStack: ['Prometheus'] },
  { patterns: ['grafana'], nodeType: 'monitoring', techStack: ['Grafana'] },
  { patterns: ['datadog'], nodeType: 'monitoring', techStack: ['Datadog'] },
  { patterns: ['jaeger'], nodeType: 'monitoring', techStack: ['Jaeger'] },
  { patterns: ['zipkin'], nodeType: 'monitoring', techStack: ['Zipkin'] },
  { patterns: ['kibana'], nodeType: 'logging', techStack: ['Kibana'] },
  { patterns: ['logstash', 'fluentd', 'fluent-bit', 'vector'], nodeType: 'logging', techStack: ['Logstash'] },

  // Workers / Schedulers
  { patterns: ['celery'], nodeType: 'worker', techStack: ['Celery'] },
  { patterns: ['sidekiq'], nodeType: 'worker', techStack: ['Sidekiq'] },
  { patterns: ['cron', 'ofelia'], nodeType: 'scheduler', techStack: [] },

  // DNS
  { patterns: ['coredns', 'bind9', 'pihole'], nodeType: 'dns', techStack: [] },

  // WAF / Security
  { patterns: ['modsecurity', 'waf'], nodeType: 'waf', techStack: [] },
];

function matchImage(image: string): { nodeType: SystemNodeType; techStack: string[]; edgeType?: SystemEdgeType } {
  const lower = image.toLowerCase();
  for (const matcher of IMAGE_MATCHERS) {
    if (matcher.patterns.some((p) => lower.includes(p))) {
      return { nodeType: matcher.nodeType, techStack: [...matcher.techStack], edgeType: matcher.edgeType };
    }
  }
  return { nodeType: 'service', techStack: [] };
}

function detectTechFromImage(image: string): string[] {
  const techs: string[] = [];
  const lower = image.toLowerCase();

  // Detect language/framework from common base images
  if (lower.includes('node') || lower.includes('deno') || lower.includes('bun')) techs.push('Node.js');
  if (lower.includes('python') || lower.includes('django') || lower.includes('flask') || lower.includes('fastapi')) techs.push('Python');
  if (lower.includes('golang') || lower.includes('/go')) techs.push('Go');
  if (lower.includes('rust')) techs.push('Rust');
  if (lower.includes('java') || lower.includes('spring') || lower.includes('openjdk')) techs.push('Java');
  if (lower.includes('dotnet') || lower.includes('aspnet')) techs.push('.NET');
  if (lower.includes('ruby') || lower.includes('rails')) techs.push('Ruby');
  if (lower.includes('php') || lower.includes('laravel')) techs.push('PHP');
  if (lower.includes('elixir') || lower.includes('phoenix')) techs.push('Elixir');

  return techs;
}

function inferEdgeType(sourceType: SystemNodeType, targetType: SystemNodeType): SystemEdgeType {
  // If target has a specific edge type (e.g., database → db-query)
  const targetMatch = IMAGE_MATCHERS.find((m) => m.nodeType === targetType && m.edgeType);
  if (targetMatch?.edgeType) return targetMatch.edgeType;

  // Default heuristics
  if (targetType === 'database') return 'db-query';
  if (targetType === 'cache') return 'tcp';
  if (targetType === 'queue' || targetType === 'stream') return 'pub-sub';

  return 'rest';
}

function formatServiceName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Docker Compose types ---

interface ComposeService {
  image?: string;
  build?: string | { context?: string; dockerfile?: string };
  depends_on?: string[] | Record<string, unknown>;
  ports?: (string | { published?: number; target?: number })[];
  volumes?: string[];
  environment?: Record<string, string> | string[];
  labels?: Record<string, string> | string[];
  networks?: string[] | Record<string, unknown>;
  links?: string[];
}

interface ComposeFile {
  version?: string;
  services?: Record<string, ComposeService>;
}

// --- Main parser ---

export function parseDockerCompose(content: string): { nodes: SystemNode[]; edges: SystemEdge[] } {
  const doc = yaml.load(content) as ComposeFile;

  if (!doc?.services || typeof doc.services !== 'object') {
    throw new Error('Invalid Docker Compose file: no services found');
  }

  const services = doc.services;
  const serviceNames = Object.keys(services);
  const nodes: SystemNode[] = [];
  const edges: SystemEdge[] = [];
  const nodeTypeMap = new Map<string, SystemNodeType>();

  // Create nodes
  serviceNames.forEach((name) => {
    const service = services[name];
    const image = service.image ?? '';
    const { nodeType, techStack: matchedTech } = matchImage(image);
    const extraTech = detectTechFromImage(image);
    const techStack = [...new Set([...matchedTech, ...extraTech])];

    // If it has a build context, it's likely a custom service
    if (service.build && nodeType === 'service' && techStack.length === 0) {
      // Try to detect from build context
      const buildStr = typeof service.build === 'string' ? service.build : service.build.dockerfile ?? '';
      techStack.push(...detectTechFromImage(buildStr));
    }

    // Add image as tech if it's a known service (not a generic base image)
    if (image && nodeType === 'service' && techStack.length === 0) {
      const imageName = image.split(':')[0].split('/').pop() ?? '';
      if (imageName) techStack.push(imageName);
    }

    nodeTypeMap.set(name, nodeType);

    // Build description from ports and volumes
    const descParts: string[] = [];
    if (service.ports && service.ports.length > 0) {
      const portStrs = service.ports.map((p) => {
        if (typeof p === 'string') return p;
        return `${p.published ?? ''}:${p.target ?? ''}`;
      });
      descParts.push(`Ports: ${portStrs.join(', ')}`);
    }

    const node: SystemNode = {
      id: `dc-${name}`,
      type: 'system',
      position: { x: 0, y: 0 }, // Will be auto-laid out
      data: {
        label: formatServiceName(name),
        nodeType,
        description: descParts.join('\n'),
        techStack,
      },
    };

    nodes.push(node);
  });

  // Create edges from depends_on
  serviceNames.forEach((name) => {
    const service = services[name];
    const deps = service.depends_on;

    if (deps) {
      const depNames = Array.isArray(deps) ? deps : Object.keys(deps);
      depNames.forEach((dep) => {
        if (serviceNames.includes(dep)) {
          const sourceType = nodeTypeMap.get(name) ?? 'service';
          const targetType = nodeTypeMap.get(dep) ?? 'service';
          edges.push({
            id: `dc-edge-${name}-${dep}`,
            source: `dc-${name}`,
            target: `dc-${dep}`,
            type: 'system',
            data: {
              edgeType: inferEdgeType(sourceType, targetType),
              label: '',
            },
          });
        }
      });
    }

    // Also create edges from links (legacy)
    if (service.links) {
      service.links.forEach((link) => {
        const depName = link.split(':')[0];
        if (serviceNames.includes(depName)) {
          // Avoid duplicates
          const edgeId = `dc-edge-${name}-${depName}`;
          if (!edges.some((e) => e.id === edgeId)) {
            const sourceType = nodeTypeMap.get(name) ?? 'service';
            const targetType = nodeTypeMap.get(depName) ?? 'service';
            edges.push({
              id: edgeId,
              source: `dc-${name}`,
              target: `dc-${depName}`,
              type: 'system',
              data: {
                edgeType: inferEdgeType(sourceType, targetType),
                label: '',
              },
            });
          }
        }
      });
    }
  });

  // Auto-layout
  const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, 'TB');

  return { nodes: layoutedNodes, edges };
}

// --- File picker ---

export function importDockerCompose(): Promise<{ nodes: SystemNode[]; edges: SystemEdge[] }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yml,.yaml';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = parseDockerCompose(reader.result as string);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
