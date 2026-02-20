import {
  Server,
  Database,
  Zap,
  MessageSquare,
  Scale,
  Monitor,
  Globe,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import type { SystemNodeType } from '@/types';

export interface NodeTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultTechStack: string[];
}

export const NODE_REGISTRY: Record<SystemNodeType, NodeTypeConfig> = {
  service: {
    label: 'Service',
    icon: Server,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    defaultTechStack: [],
  },
  database: {
    label: 'Database',
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    defaultTechStack: ['PostgreSQL'],
  },
  cache: {
    label: 'Cache',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    defaultTechStack: ['Redis'],
  },
  queue: {
    label: 'Message Queue',
    icon: MessageSquare,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    defaultTechStack: ['RabbitMQ'],
  },
  'load-balancer': {
    label: 'Load Balancer',
    icon: Scale,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    defaultTechStack: ['Nginx'],
  },
  client: {
    label: 'Client',
    icon: Monitor,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    defaultTechStack: [],
  },
  cdn: {
    label: 'CDN',
    icon: Globe,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    defaultTechStack: ['CloudFront'],
  },
  'api-gateway': {
    label: 'API Gateway',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    defaultTechStack: [],
  },
};
