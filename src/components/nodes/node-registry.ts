import {
  Server,
  Database,
  Zap,
  MessageSquare,
  Scale,
  Monitor,
  Globe,
  Shield,
  BoxSelect,
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

export interface NodeTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  darkBgColor: string;
  darkBorderColor: string;
  defaultTechStack: string[];
  category: NodeCategory;
}

export const NODE_REGISTRY: Record<SystemNodeType, NodeTypeConfig> = {
  // Client & Edge
  client: {
    label: 'Client',
    icon: Monitor,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    darkBgColor: 'dark:bg-purple-950',
    darkBorderColor: 'dark:border-purple-700',
    defaultTechStack: [],
    category: 'Client & Edge',
  },
  cdn: {
    label: 'CDN',
    icon: Globe,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    darkBgColor: 'dark:bg-teal-950',
    darkBorderColor: 'dark:border-teal-700',
    defaultTechStack: ['CloudFront'],
    category: 'Client & Edge',
  },
  dns: {
    label: 'DNS',
    icon: Globe2,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    darkBgColor: 'dark:bg-sky-950',
    darkBorderColor: 'dark:border-sky-700',
    defaultTechStack: ['Route 53'],
    category: 'Client & Edge',
  },
  waf: {
    label: 'WAF',
    icon: ShieldCheck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    darkBgColor: 'dark:bg-orange-950',
    darkBorderColor: 'dark:border-orange-700',
    defaultTechStack: ['AWS WAF'],
    category: 'Client & Edge',
  },
  'load-balancer': {
    label: 'Load Balancer',
    icon: Scale,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    darkBgColor: 'dark:bg-indigo-950',
    darkBorderColor: 'dark:border-indigo-700',
    defaultTechStack: ['Nginx'],
    category: 'Client & Edge',
  },
  'api-gateway': {
    label: 'API Gateway',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    darkBgColor: 'dark:bg-red-950',
    darkBorderColor: 'dark:border-red-700',
    defaultTechStack: [],
    category: 'Client & Edge',
  },

  // Compute
  service: {
    label: 'Service',
    icon: Server,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    darkBgColor: 'dark:bg-blue-950',
    darkBorderColor: 'dark:border-blue-700',
    defaultTechStack: [],
    category: 'Compute',
  },
  worker: {
    label: 'Worker',
    icon: Cog,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    darkBgColor: 'dark:bg-slate-950',
    darkBorderColor: 'dark:border-slate-700',
    defaultTechStack: [],
    category: 'Compute',
  },
  serverless: {
    label: 'Serverless',
    icon: CloudLightning,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-300',
    darkBgColor: 'dark:bg-violet-950',
    darkBorderColor: 'dark:border-violet-700',
    defaultTechStack: ['AWS Lambda'],
    category: 'Compute',
  },
  'container-cluster': {
    label: 'Container Cluster',
    icon: Boxes,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    darkBgColor: 'dark:bg-cyan-950',
    darkBorderColor: 'dark:border-cyan-700',
    defaultTechStack: ['Kubernetes'],
    category: 'Compute',
  },

  // Data
  database: {
    label: 'Database',
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    darkBgColor: 'dark:bg-green-950',
    darkBorderColor: 'dark:border-green-700',
    defaultTechStack: ['PostgreSQL'],
    category: 'Data',
  },
  cache: {
    label: 'Cache',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    darkBgColor: 'dark:bg-amber-950',
    darkBorderColor: 'dark:border-amber-700',
    defaultTechStack: ['Redis'],
    category: 'Data',
  },
  'object-storage': {
    label: 'Object Storage',
    icon: HardDrive,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    darkBgColor: 'dark:bg-emerald-950',
    darkBorderColor: 'dark:border-emerald-700',
    defaultTechStack: ['S3'],
    category: 'Data',
  },
  'search-index': {
    label: 'Search Index',
    icon: Search,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    darkBgColor: 'dark:bg-yellow-950',
    darkBorderColor: 'dark:border-yellow-700',
    defaultTechStack: ['Elasticsearch'],
    category: 'Data',
  },

  // Async
  queue: {
    label: 'Message Queue',
    icon: MessageSquare,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    darkBgColor: 'dark:bg-pink-950',
    darkBorderColor: 'dark:border-pink-700',
    defaultTechStack: ['RabbitMQ'],
    category: 'Async',
  },
  stream: {
    label: 'Stream',
    icon: Radio,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
    darkBgColor: 'dark:bg-rose-950',
    darkBorderColor: 'dark:border-rose-700',
    defaultTechStack: ['Kafka'],
    category: 'Async',
  },
  scheduler: {
    label: 'Scheduler',
    icon: Clock,
    color: 'text-stone-600',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-300',
    darkBgColor: 'dark:bg-stone-950',
    darkBorderColor: 'dark:border-stone-700',
    defaultTechStack: [],
    category: 'Async',
  },

  // Observability
  logging: {
    label: 'Logging',
    icon: ScrollText,
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-300',
    darkBgColor: 'dark:bg-lime-950',
    darkBorderColor: 'dark:border-lime-700',
    defaultTechStack: ['ELK Stack'],
    category: 'Observability',
  },
  monitoring: {
    label: 'Monitoring',
    icon: Activity,
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-300',
    darkBgColor: 'dark:bg-fuchsia-950',
    darkBorderColor: 'dark:border-fuchsia-700',
    defaultTechStack: ['Prometheus'],
    category: 'Observability',
  },

  // Other
  group: {
    label: 'Group',
    icon: BoxSelect,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50/50',
    borderColor: 'border-slate-300',
    darkBgColor: 'dark:bg-slate-900/30',
    darkBorderColor: 'dark:border-slate-600',
    defaultTechStack: [],
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
