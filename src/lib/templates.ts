import type { SystemNode, SystemEdge } from '@/types';

export interface Template {
  id: string;
  name: string;
  description: string;
  nodes: SystemNode[];
  edges: SystemEdge[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Client > LB > API Gateway > 3 Services > 2 DBs + Queue',
    nodes: [
      { id: 't1-1', type: 'system', position: { x: 400, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'Web/Mobile client', techStack: ['React'] } },
      { id: 't1-2', type: 'system', position: { x: 400, y: 160 }, data: { label: 'Load Balancer', nodeType: 'load-balancer', description: '', techStack: ['Nginx'] } },
      { id: 't1-3', type: 'system', position: { x: 400, y: 320 }, data: { label: 'API Gateway', nodeType: 'api-gateway', description: 'Route & auth', techStack: ['Kong'] } },
      { id: 't1-4', type: 'system', position: { x: 80, y: 520 }, data: { label: 'User Service', nodeType: 'service', description: 'User management', techStack: ['Node.js'] } },
      { id: 't1-5', type: 'system', position: { x: 380, y: 520 }, data: { label: 'Order Service', nodeType: 'service', description: 'Order processing', techStack: ['Go'] } },
      { id: 't1-9', type: 'system', position: { x: 620, y: 520 }, data: { label: 'Message Queue', nodeType: 'queue', description: '', techStack: ['RabbitMQ'] } },
      { id: 't1-6', type: 'system', position: { x: 860, y: 520 }, data: { label: 'Notification Service', nodeType: 'service', description: 'Email/SMS notifications', techStack: ['Python'] } },
      { id: 't1-7', type: 'system', position: { x: 80, y: 720 }, data: { label: 'User DB', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
      { id: 't1-8', type: 'system', position: { x: 380, y: 720 }, data: { label: 'Order DB', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
    ],
    edges: [
      { id: 't1-e1', source: 't1-1', target: 't1-2', type: 'system', data: { edgeType: 'rest', label: 'HTTPS' } },
      { id: 't1-e2', source: 't1-2', target: 't1-3', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't1-e3', source: 't1-3', target: 't1-4', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't1-e4', source: 't1-3', target: 't1-5', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't1-e5', source: 't1-3', target: 't1-6', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't1-e6', source: 't1-4', target: 't1-7', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't1-e7', source: 't1-5', target: 't1-8', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't1-e8', source: 't1-5', target: 't1-9', sourceHandle: 'right', targetHandle: 'left', type: 'system', data: { edgeType: 'pub-sub', label: 'OrderCreated' } },
      { id: 't1-e9', source: 't1-9', target: 't1-6', sourceHandle: 'right', targetHandle: 'left', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
    ],
  },
  {
    id: 'monolith',
    name: 'Monolith',
    description: 'Client > LB > Monolith Service > DB + Cache',
    nodes: [
      { id: 't2-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'Web application', techStack: ['React'] } },
      { id: 't2-2', type: 'system', position: { x: 300, y: 140 }, data: { label: 'Load Balancer', nodeType: 'load-balancer', description: '', techStack: ['Nginx'] } },
      { id: 't2-3', type: 'system', position: { x: 300, y: 280 }, data: { label: 'Monolith', nodeType: 'service', description: 'Main application server', techStack: ['Django', 'Python'] } },
      { id: 't2-4', type: 'system', position: { x: 100, y: 460 }, data: { label: 'Database', nodeType: 'database', description: 'Primary datastore', techStack: ['PostgreSQL'] } },
      { id: 't2-5', type: 'system', position: { x: 500, y: 460 }, data: { label: 'Cache', nodeType: 'cache', description: 'Session & query cache', techStack: ['Redis'] } },
    ],
    edges: [
      { id: 't2-e1', source: 't2-1', target: 't2-2', type: 'system', data: { edgeType: 'rest', label: 'HTTPS' } },
      { id: 't2-e2', source: 't2-2', target: 't2-3', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't2-e3', source: 't2-3', target: 't2-4', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't2-e4', source: 't2-3', target: 't2-5', type: 'system', data: { edgeType: 'tcp', label: '' } },
    ],
  },
  {
    id: 'event-driven',
    name: 'Event-Driven',
    description: 'Producers > Event Bus > Consumers > DBs',
    nodes: [
      { id: 't3-1', type: 'system', position: { x: 120, y: 0 }, data: { label: 'Order Producer', nodeType: 'service', description: 'Publishes order events', techStack: ['Node.js'] } },
      { id: 't3-2', type: 'system', position: { x: 520, y: 0 }, data: { label: 'Payment Producer', nodeType: 'service', description: 'Publishes payment events', techStack: ['Java'] } },
      { id: 't3-3', type: 'system', position: { x: 320, y: 180 }, data: { label: 'Event Bus', nodeType: 'queue', description: 'Central event backbone', techStack: ['Apache Kafka'] } },
      { id: 't3-4', type: 'system', position: { x: 0, y: 360 }, data: { label: 'Inventory Consumer', nodeType: 'service', description: 'Updates stock levels', techStack: ['Go'] } },
      { id: 't3-5', type: 'system', position: { x: 320, y: 360 }, data: { label: 'Analytics Consumer', nodeType: 'service', description: 'Processes analytics', techStack: ['Python'] } },
      { id: 't3-6', type: 'system', position: { x: 640, y: 360 }, data: { label: 'Notification Consumer', nodeType: 'service', description: 'Sends notifications', techStack: ['Node.js'] } },
      { id: 't3-7', type: 'system', position: { x: 0, y: 540 }, data: { label: 'Inventory DB', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
      { id: 't3-8', type: 'system', position: { x: 320, y: 540 }, data: { label: 'Analytics DB', nodeType: 'database', description: '', techStack: ['ClickHouse'] } },
    ],
    edges: [
      { id: 't3-e1', source: 't3-1', target: 't3-3', type: 'system', data: { edgeType: 'pub-sub', label: 'OrderEvents' } },
      { id: 't3-e2', source: 't3-2', target: 't3-3', type: 'system', data: { edgeType: 'pub-sub', label: 'PaymentEvents' } },
      { id: 't3-e3', source: 't3-3', target: 't3-4', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't3-e4', source: 't3-3', target: 't3-5', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't3-e5', source: 't3-3', target: 't3-6', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't3-e6', source: 't3-4', target: 't3-7', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't3-e7', source: 't3-5', target: 't3-8', type: 'system', data: { edgeType: 'db-query', label: '' } },
    ],
  },
  {
    id: 'client-server',
    name: 'Client-Server',
    description: 'Client > CDN > API Server > DB + Cache',
    nodes: [
      { id: 't4-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'SPA application', techStack: ['React', 'TypeScript'] } },
      { id: 't4-2', type: 'system', position: { x: 300, y: 140 }, data: { label: 'CDN', nodeType: 'cdn', description: 'Static assets & caching', techStack: ['CloudFront'] } },
      { id: 't4-3', type: 'system', position: { x: 300, y: 280 }, data: { label: 'API Server', nodeType: 'service', description: 'REST API backend', techStack: ['Express', 'Node.js'] } },
      { id: 't4-4', type: 'system', position: { x: 100, y: 460 }, data: { label: 'Database', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
      { id: 't4-5', type: 'system', position: { x: 500, y: 460 }, data: { label: 'Cache', nodeType: 'cache', description: '', techStack: ['Redis'] } },
    ],
    edges: [
      { id: 't4-e1', source: 't4-1', target: 't4-2', type: 'system', data: { edgeType: 'rest', label: 'HTTPS' } },
      { id: 't4-e2', source: 't4-2', target: 't4-3', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't4-e3', source: 't4-3', target: 't4-4', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't4-e4', source: 't4-3', target: 't4-5', type: 'system', data: { edgeType: 'tcp', label: '' } },
    ],
  },
];
