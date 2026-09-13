import {
  Server,
  Database,
  Zap,
  MessageSquare,
  Scale,
  Monitor,
  Globe,
  Shield,
  SquareDashed,
  Globe2,
  ShieldCheck,
  Cog,
  CloudLightning,
  Boxes,
  HardDrive,
  Search,
  Radio,
  Clock,
  ScrollText,
  Activity,
  Shapes,
  type LucideIcon,
} from 'lucide-react';
import type { SystemNodeType } from '@/types';

export type NodeCategory =
  | 'Client & Edge'
  | 'Compute'
  | 'Data'
  | 'Async'
  | 'Observability'
  | 'Other';

export const NODE_CATEGORIES: NodeCategory[] = [
  'Client & Edge',
  'Compute',
  'Data',
  'Async',
  'Observability',
  'Other',
];

/** One icon per category, used by the collapsed library rail. */
export const CATEGORY_ICONS: Record<NodeCategory, LucideIcon> = {
  'Client & Edge': Monitor,
  Compute: Server,
  Data: Database,
  Async: Radio,
  Observability: Activity,
  Other: Shapes,
};

export interface NodeTypeConfig {
  label: string;
  icon: LucideIcon;
  /** Component color (Tailwind 600 shade). Used only for the icon, icon chip tint and minimap. */
  color: string;
  defaultTechStack: string[];
  /** Quick-add suggestions in the node editor's tech stack field. */
  suggestedTech: string[];
  category: NodeCategory;
}

export const NODE_REGISTRY: Record<SystemNodeType, NodeTypeConfig> = {
  // Client & Edge
  client: {
    label: 'Client',
    icon: Monitor,
    color: '#9333ea', // purple-600
    defaultTechStack: [],
    suggestedTech: ['React', 'Next.js', 'iOS', 'Android'],
    category: 'Client & Edge',
  },
  cdn: {
    label: 'CDN',
    icon: Globe,
    color: '#0d9488', // teal-600
    defaultTechStack: ['CloudFront'],
    suggestedTech: ['CloudFront', 'Cloudflare', 'Fastly'],
    category: 'Client & Edge',
  },
  dns: {
    label: 'DNS',
    icon: Globe2,
    color: '#0284c7', // sky-600
    defaultTechStack: ['Route 53'],
    suggestedTech: ['Route 53', 'Cloudflare DNS'],
    category: 'Client & Edge',
  },
  waf: {
    label: 'WAF',
    icon: ShieldCheck,
    color: '#ea580c', // orange-600
    defaultTechStack: ['AWS WAF'],
    suggestedTech: ['AWS WAF', 'Cloudflare WAF'],
    category: 'Client & Edge',
  },
  'load-balancer': {
    label: 'Load Balancer',
    icon: Scale,
    color: '#4f46e5', // indigo-600
    defaultTechStack: ['Nginx'],
    suggestedTech: ['Nginx', 'HAProxy', 'AWS ALB', 'Envoy'],
    category: 'Client & Edge',
  },
  'api-gateway': {
    label: 'API Gateway',
    icon: Shield,
    color: '#dc2626', // red-600
    defaultTechStack: [],
    suggestedTech: ['Kong', 'AWS API Gateway', 'Apigee'],
    category: 'Client & Edge',
  },

  // Compute
  service: {
    label: 'Service',
    icon: Server,
    color: '#2563eb', // blue-600
    defaultTechStack: [],
    suggestedTech: ['Node.js', 'Go', 'Python', 'Java'],
    category: 'Compute',
  },
  worker: {
    label: 'Worker',
    icon: Cog,
    color: '#475569', // slate-600
    defaultTechStack: [],
    suggestedTech: ['Celery', 'Sidekiq', 'BullMQ'],
    category: 'Compute',
  },
  serverless: {
    label: 'Serverless',
    icon: CloudLightning,
    color: '#7c3aed', // violet-600
    defaultTechStack: ['AWS Lambda'],
    suggestedTech: ['AWS Lambda', 'Cloudflare Workers', 'TypeScript'],
    category: 'Compute',
  },
  'container-cluster': {
    label: 'Container Cluster',
    icon: Boxes,
    color: '#0891b2', // cyan-600
    defaultTechStack: ['Kubernetes'],
    suggestedTech: ['Kubernetes', 'ECS', 'Nomad'],
    category: 'Compute',
  },

  // Data
  database: {
    label: 'Database',
    icon: Database,
    color: '#16a34a', // green-600
    defaultTechStack: ['PostgreSQL'],
    suggestedTech: ['PostgreSQL', 'MySQL', 'MongoDB', 'DynamoDB'],
    category: 'Data',
  },
  cache: {
    label: 'Cache',
    icon: Zap,
    color: '#d97706', // amber-600
    defaultTechStack: ['Redis'],
    suggestedTech: ['Redis', 'Memcached', 'Valkey'],
    category: 'Data',
  },
  'object-storage': {
    label: 'Object Storage',
    icon: HardDrive,
    color: '#059669', // emerald-600
    defaultTechStack: ['S3'],
    suggestedTech: ['S3', 'GCS', 'R2'],
    category: 'Data',
  },
  'search-index': {
    label: 'Search Index',
    icon: Search,
    color: '#ca8a04', // yellow-600
    defaultTechStack: ['Elasticsearch'],
    suggestedTech: ['Elasticsearch', 'OpenSearch', 'Meilisearch'],
    category: 'Data',
  },

  // Async
  queue: {
    label: 'Message Queue',
    icon: MessageSquare,
    color: '#db2777', // pink-600
    defaultTechStack: ['RabbitMQ'],
    suggestedTech: ['RabbitMQ', 'SQS', 'DLQ'],
    category: 'Async',
  },
  stream: {
    label: 'Stream',
    icon: Radio,
    color: '#e11d48', // rose-600
    defaultTechStack: ['Kafka'],
    suggestedTech: ['Kafka', 'Kinesis', 'Redpanda'],
    category: 'Async',
  },
  scheduler: {
    label: 'Scheduler',
    icon: Clock,
    color: '#57534e', // stone-600
    defaultTechStack: [],
    suggestedTech: ['Cron', 'EventBridge', 'Temporal'],
    category: 'Async',
  },

  // Observability
  logging: {
    label: 'Logging',
    icon: ScrollText,
    color: '#65a30d', // lime-600
    defaultTechStack: ['ELK Stack'],
    suggestedTech: ['ELK Stack', 'CloudWatch', 'Loki'],
    category: 'Observability',
  },
  monitoring: {
    label: 'Monitoring',
    icon: Activity,
    color: '#c026d3', // fuchsia-600
    defaultTechStack: ['Prometheus'],
    suggestedTech: ['Prometheus', 'Grafana', 'Datadog'],
    category: 'Observability',
  },

  // Other
  group: {
    label: 'Group',
    icon: SquareDashed,
    color: '#64748b', // slate-500
    defaultTechStack: [],
    suggestedTech: [],
    category: 'Other',
  },
};

/** Group node types by category, in category order */
export function getNodesByCategory(): { category: NodeCategory; types: { type: SystemNodeType; config: NodeTypeConfig }[] }[] {
  return NODE_CATEGORIES.map((category) => ({
    category,
    types: (Object.entries(NODE_REGISTRY) as [SystemNodeType, NodeTypeConfig][])
      .filter(([, config]) => config.category === category)
      .map(([type, config]) => ({ type, config })),
  })).filter((group) => group.types.length > 0);
}
