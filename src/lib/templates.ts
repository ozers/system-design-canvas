import type { SystemNode, SystemEdge } from '@/types';

export interface Template {
  id: string;
  name: string;
  description: string;
  nodes: SystemNode[];
  edges: SystemEdge[];
}

export const TEMPLATES: Template[] = [
  // ─── 1. Microservices ───
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Client > LB > API Gateway > Services > DBs + Queue',
    nodes: [
      { id: 't1-1', type: 'system', position: { x: 400, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'Web/Mobile', techStack: ['React'] } },
      { id: 't1-2', type: 'system', position: { x: 400, y: 180 }, data: { label: 'Load Balancer', nodeType: 'load-balancer', description: '', techStack: ['Nginx'] } },
      { id: 't1-3', type: 'system', position: { x: 400, y: 360 }, data: { label: 'API Gateway', nodeType: 'api-gateway', description: 'Route & auth', techStack: ['Kong'] } },
      { id: 't1-4', type: 'system', position: { x: 0, y: 560 }, data: { label: 'User Service', nodeType: 'service', description: 'User management', techStack: ['Node.js'] } },
      { id: 't1-5', type: 'system', position: { x: 280, y: 560 }, data: { label: 'Order Service', nodeType: 'service', description: 'Order processing', techStack: ['Go'] } },
      { id: 't1-9', type: 'system', position: { x: 560, y: 560 }, data: { label: 'Queue', nodeType: 'queue', description: '', techStack: ['RabbitMQ'] } },
      { id: 't1-6', type: 'system', position: { x: 840, y: 560 }, data: { label: 'Notification', nodeType: 'service', description: 'Email/SMS', techStack: ['Python'] } },
      { id: 't1-7', type: 'system', position: { x: 0, y: 760 }, data: { label: 'User DB', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
      { id: 't1-8', type: 'system', position: { x: 280, y: 760 }, data: { label: 'Order DB', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
    ],
    edges: [
      { id: 't1-e1', source: 't1-1', target: 't1-2', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: 'HTTPS' } },
      { id: 't1-e2', source: 't1-2', target: 't1-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't1-e3', source: 't1-3', target: 't1-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't1-e4', source: 't1-3', target: 't1-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't1-e5', source: 't1-3', target: 't1-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't1-e6', source: 't1-4', target: 't1-7', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't1-e7', source: 't1-5', target: 't1-8', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't1-e8', source: 't1-5', target: 't1-9', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'system', data: { edgeType: 'pub-sub', label: 'OrderCreated' } },
      { id: 't1-e9', source: 't1-9', target: 't1-6', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
    ],
  },

  // ─── 2. Monolith ───
  {
    id: 'monolith',
    name: 'Monolith',
    description: 'Client > LB > Monolith > DB + Cache',
    nodes: [
      { id: 't2-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'Web application', techStack: ['React'] } },
      { id: 't2-2', type: 'system', position: { x: 300, y: 180 }, data: { label: 'Load Balancer', nodeType: 'load-balancer', description: '', techStack: ['Nginx'] } },
      { id: 't2-3', type: 'system', position: { x: 300, y: 360 }, data: { label: 'Monolith', nodeType: 'service', description: 'Main application', techStack: ['Django', 'Python'] } },
      { id: 't2-4', type: 'system', position: { x: 120, y: 560 }, data: { label: 'Database', nodeType: 'database', description: 'Primary datastore', techStack: ['PostgreSQL'] } },
      { id: 't2-5', type: 'system', position: { x: 480, y: 560 }, data: { label: 'Cache', nodeType: 'cache', description: 'Session & query cache', techStack: ['Redis'] } },
    ],
    edges: [
      { id: 't2-e1', source: 't2-1', target: 't2-2', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: 'HTTPS' } },
      { id: 't2-e2', source: 't2-2', target: 't2-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't2-e3', source: 't2-3', target: 't2-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't2-e4', source: 't2-3', target: 't2-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'tcp', label: '' } },
    ],
  },

  // ─── 3. Event-Driven ───
  {
    id: 'event-driven',
    name: 'Event-Driven',
    description: 'Producers > Event Bus > Consumers > DBs',
    nodes: [
      { id: 't3-1', type: 'system', position: { x: 80, y: 0 }, data: { label: 'Order Producer', nodeType: 'service', description: 'Publishes order events', techStack: ['Node.js'] } },
      { id: 't3-2', type: 'system', position: { x: 520, y: 0 }, data: { label: 'Payment Producer', nodeType: 'service', description: 'Publishes payment events', techStack: ['Java'] } },
      { id: 't3-3', type: 'system', position: { x: 300, y: 200 }, data: { label: 'Event Bus', nodeType: 'queue', description: 'Central event backbone', techStack: ['Apache Kafka'] } },
      { id: 't3-4', type: 'system', position: { x: 40, y: 400 }, data: { label: 'Inventory', nodeType: 'service', description: 'Updates stock levels', techStack: ['Go'] } },
      { id: 't3-5', type: 'system', position: { x: 300, y: 400 }, data: { label: 'Analytics', nodeType: 'service', description: 'Processes analytics', techStack: ['Python'] } },
      { id: 't3-6', type: 'system', position: { x: 560, y: 400 }, data: { label: 'Notification', nodeType: 'service', description: 'Sends notifications', techStack: ['Node.js'] } },
      { id: 't3-7', type: 'system', position: { x: 40, y: 600 }, data: { label: 'Inventory DB', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
      { id: 't3-8', type: 'system', position: { x: 300, y: 600 }, data: { label: 'Analytics DB', nodeType: 'database', description: '', techStack: ['ClickHouse'] } },
    ],
    edges: [
      { id: 't3-e1', source: 't3-1', target: 't3-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: 'OrderEvents' } },
      { id: 't3-e2', source: 't3-2', target: 't3-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: 'PaymentEvents' } },
      { id: 't3-e3', source: 't3-3', target: 't3-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't3-e4', source: 't3-3', target: 't3-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't3-e5', source: 't3-3', target: 't3-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't3-e6', source: 't3-4', target: 't3-7', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't3-e7', source: 't3-5', target: 't3-8', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
    ],
  },

  // ─── 4. Client-Server ───
  {
    id: 'client-server',
    name: 'Client-Server',
    description: 'Client > CDN > API Server > DB + Cache',
    nodes: [
      { id: 't4-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'SPA application', techStack: ['React', 'TypeScript'] } },
      { id: 't4-2', type: 'system', position: { x: 300, y: 180 }, data: { label: 'CDN', nodeType: 'cdn', description: 'Static assets', techStack: ['CloudFront'] } },
      { id: 't4-3', type: 'system', position: { x: 300, y: 360 }, data: { label: 'API Server', nodeType: 'service', description: 'REST API backend', techStack: ['Express', 'Node.js'] } },
      { id: 't4-4', type: 'system', position: { x: 120, y: 560 }, data: { label: 'Database', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
      { id: 't4-5', type: 'system', position: { x: 480, y: 560 }, data: { label: 'Cache', nodeType: 'cache', description: '', techStack: ['Redis'] } },
    ],
    edges: [
      { id: 't4-e1', source: 't4-1', target: 't4-2', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: 'HTTPS' } },
      { id: 't4-e2', source: 't4-2', target: 't4-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't4-e3', source: 't4-3', target: 't4-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't4-e4', source: 't4-3', target: 't4-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'tcp', label: '' } },
    ],
  },

  // ─── 5. Serverless ───
  {
    id: 'serverless',
    name: 'Serverless',
    description: 'Client > API Gateway > Lambda Functions > DynamoDB + S3',
    nodes: [
      { id: 't5-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'Web/Mobile', techStack: ['React'] } },
      { id: 't5-2', type: 'system', position: { x: 300, y: 180 }, data: { label: 'API Gateway', nodeType: 'api-gateway', description: 'REST routing', techStack: ['AWS API Gateway'] } },
      { id: 't5-3', type: 'system', position: { x: 60, y: 380 }, data: { label: 'Auth Function', nodeType: 'service', description: 'Authentication', techStack: ['Lambda', 'Node.js'] } },
      { id: 't5-4', type: 'system', position: { x: 300, y: 380 }, data: { label: 'API Function', nodeType: 'service', description: 'Business logic', techStack: ['Lambda', 'Python'] } },
      { id: 't5-5', type: 'system', position: { x: 540, y: 380 }, data: { label: 'Worker', nodeType: 'service', description: 'Background tasks', techStack: ['Lambda', 'Go'] } },
      { id: 't5-6', type: 'system', position: { x: 180, y: 580 }, data: { label: 'DynamoDB', nodeType: 'database', description: 'NoSQL datastore', techStack: ['DynamoDB'] } },
      { id: 't5-7', type: 'system', position: { x: 480, y: 580 }, data: { label: 'S3 Bucket', nodeType: 'object-storage', description: 'Object storage', techStack: ['AWS S3'] } },
    ],
    edges: [
      { id: 't5-e1', source: 't5-1', target: 't5-2', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: 'HTTPS' } },
      { id: 't5-e2', source: 't5-2', target: 't5-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't5-e3', source: 't5-2', target: 't5-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't5-e4', source: 't5-2', target: 't5-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't5-e5', source: 't5-3', target: 't5-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't5-e6', source: 't5-4', target: 't5-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't5-e7', source: 't5-5', target: 't5-7', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
    ],
  },

  // ─── 6. Data Pipeline ───
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'Data Sources > Kafka > Processors > Data Warehouse + Analytics',
    nodes: [
      { id: 't6-1', type: 'system', position: { x: 60, y: 0 }, data: { label: 'App Events', nodeType: 'service', description: 'Event source', techStack: ['Node.js'] } },
      { id: 't6-2', type: 'system', position: { x: 300, y: 0 }, data: { label: 'IoT Devices', nodeType: 'client', description: 'Sensor data', techStack: ['MQTT'] } },
      { id: 't6-3', type: 'system', position: { x: 540, y: 0 }, data: { label: 'External APIs', nodeType: 'service', description: 'Third-party data', techStack: ['REST'] } },
      { id: 't6-4', type: 'system', position: { x: 300, y: 200 }, data: { label: 'Kafka', nodeType: 'queue', description: 'Event streaming', techStack: ['Apache Kafka'] } },
      { id: 't6-5', type: 'system', position: { x: 100, y: 400 }, data: { label: 'Stream Processor', nodeType: 'service', description: 'Real-time ETL', techStack: ['Apache Flink'] } },
      { id: 't6-6', type: 'system', position: { x: 500, y: 400 }, data: { label: 'Batch Processor', nodeType: 'service', description: 'Batch ETL', techStack: ['Apache Spark'] } },
      { id: 't6-7', type: 'system', position: { x: 100, y: 600 }, data: { label: 'Data Warehouse', nodeType: 'database', description: 'Analytical storage', techStack: ['Snowflake'] } },
      { id: 't6-8', type: 'system', position: { x: 500, y: 600 }, data: { label: 'Analytics DB', nodeType: 'database', description: 'Time-series', techStack: ['ClickHouse'] } },
      { id: 't6-9', type: 'system', position: { x: 300, y: 600 }, data: { label: 'Cache', nodeType: 'cache', description: 'Query cache', techStack: ['Redis'] } },
    ],
    edges: [
      { id: 't6-e1', source: 't6-1', target: 't6-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: 'Events' } },
      { id: 't6-e2', source: 't6-2', target: 't6-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: 'Telemetry' } },
      { id: 't6-e3', source: 't6-3', target: 't6-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: 'Data' } },
      { id: 't6-e4', source: 't6-4', target: 't6-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't6-e5', source: 't6-4', target: 't6-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't6-e6', source: 't6-5', target: 't6-7', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't6-e7', source: 't6-6', target: 't6-8', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't6-e8', source: 't6-5', target: 't6-9', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'system', data: { edgeType: 'tcp', label: '' } },
    ],
  },

  // ─── 7. Real-time Analytics ───
  {
    id: 'realtime-analytics',
    name: 'Real-time Analytics',
    description: 'LB > Ingest API > Kafka > Stream Processing + Search',
    nodes: [
      { id: 't7-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'Dashboard & SDK', techStack: ['React'] } },
      { id: 't7-2', type: 'system', position: { x: 300, y: 180 }, data: { label: 'Load Balancer', nodeType: 'load-balancer', description: '', techStack: ['ALB'] } },
      { id: 't7-3', type: 'system', position: { x: 300, y: 360 }, data: { label: 'Ingest API', nodeType: 'service', description: 'Event ingestion', techStack: ['Go'] } },
      { id: 't7-4', type: 'system', position: { x: 580, y: 360 }, data: { label: 'Cache', nodeType: 'cache', description: 'Rate limit state', techStack: ['Redis'] } },
      { id: 't7-5', type: 'system', position: { x: 300, y: 560 }, data: { label: 'Kafka', nodeType: 'stream', description: 'Event streaming', techStack: ['Apache Kafka'] } },
      { id: 't7-6', type: 'system', position: { x: 100, y: 760 }, data: { label: 'Stream Processor', nodeType: 'worker', description: 'Real-time aggregation', techStack: ['Flink'] } },
      { id: 't7-7', type: 'system', position: { x: 500, y: 760 }, data: { label: 'Batch Scheduler', nodeType: 'scheduler', description: 'Rollup jobs', techStack: ['Airflow'] } },
      { id: 't7-8', type: 'system', position: { x: 100, y: 960 }, data: { label: 'Search Index', nodeType: 'search-index', description: 'Event search', techStack: ['Elasticsearch'] } },
      { id: 't7-9', type: 'system', position: { x: 500, y: 960 }, data: { label: 'Monitoring', nodeType: 'monitoring', description: 'Metrics & alerts', techStack: ['Prometheus'] } },
    ],
    edges: [
      { id: 't7-e1', source: 't7-1', target: 't7-2', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't7-e2', source: 't7-2', target: 't7-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't7-e3', source: 't7-3', target: 't7-4', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'system', data: { edgeType: 'tcp', label: '' } },
      { id: 't7-e4', source: 't7-3', target: 't7-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: 'Events' } },
      { id: 't7-e5', source: 't7-5', target: 't7-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't7-e6', source: 't7-5', target: 't7-7', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't7-e7', source: 't7-6', target: 't7-8', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't7-e8', source: 't7-7', target: 't7-9', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'tcp', label: 'Metrics' } },
    ],
  },

  // ─── 8. Serverless Fullstack ───
  {
    id: 'serverless-fullstack',
    name: 'Serverless Fullstack',
    description: 'CDN > API Gateway > Lambda > DynamoDB + S3 + SQS + Logging',
    nodes: [
      { id: 't8-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: 'SPA', techStack: ['Next.js'] } },
      { id: 't8-2', type: 'system', position: { x: 300, y: 180 }, data: { label: 'CDN', nodeType: 'cdn', description: 'Static hosting', techStack: ['CloudFront'] } },
      { id: 't8-3', type: 'system', position: { x: 300, y: 360 }, data: { label: 'API Gateway', nodeType: 'api-gateway', description: '', techStack: ['AWS API Gateway'] } },
      { id: 't8-4', type: 'system', position: { x: 100, y: 560 }, data: { label: 'Auth Lambda', nodeType: 'serverless', description: 'JWT auth', techStack: ['AWS Lambda'] } },
      { id: 't8-5', type: 'system', position: { x: 500, y: 560 }, data: { label: 'API Lambda', nodeType: 'serverless', description: 'Business logic', techStack: ['AWS Lambda'] } },
      { id: 't8-6', type: 'system', position: { x: 100, y: 760 }, data: { label: 'DynamoDB', nodeType: 'database', description: '', techStack: ['DynamoDB'] } },
      { id: 't8-7', type: 'system', position: { x: 500, y: 760 }, data: { label: 'Queue', nodeType: 'queue', description: 'Async jobs', techStack: ['SQS'] } },
      { id: 't8-8', type: 'system', position: { x: 780, y: 560 }, data: { label: 'Object Storage', nodeType: 'object-storage', description: 'File uploads', techStack: ['S3'] } },
      { id: 't8-9', type: 'system', position: { x: 500, y: 960 }, data: { label: 'Worker Lambda', nodeType: 'serverless', description: 'Background tasks', techStack: ['AWS Lambda'] } },
      { id: 't8-10', type: 'system', position: { x: 500, y: 1160 }, data: { label: 'Logging', nodeType: 'logging', description: 'Centralized logs', techStack: ['CloudWatch'] } },
    ],
    edges: [
      { id: 't8-e1', source: 't8-1', target: 't8-2', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't8-e2', source: 't8-2', target: 't8-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't8-e3', source: 't8-3', target: 't8-4', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't8-e4', source: 't8-3', target: 't8-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't8-e5', source: 't8-4', target: 't8-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't8-e6', source: 't8-5', target: 't8-8', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't8-e7', source: 't8-5', target: 't8-7', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't8-e8', source: 't8-7', target: 't8-9', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
      { id: 't8-e9', source: 't8-9', target: 't8-10', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'tcp', label: 'Logs' } },
    ],
  },

  // ─── 9. Kubernetes Platform ───
  {
    id: 'kubernetes-platform',
    name: 'Kubernetes Platform',
    description: 'Ingress > K8s Cluster > Services + Monitoring + Logging',
    nodes: [
      { id: 't9-1', type: 'system', position: { x: 300, y: 0 }, data: { label: 'Client', nodeType: 'client', description: '', techStack: [] } },
      { id: 't9-2', type: 'system', position: { x: 300, y: 180 }, data: { label: 'Ingress', nodeType: 'load-balancer', description: 'K8s Ingress', techStack: ['Nginx Ingress'] } },
      { id: 't9-3', type: 'system', position: { x: 300, y: 360 }, data: { label: 'K8s Cluster', nodeType: 'container-cluster', description: 'Container orchestration', techStack: ['Kubernetes', 'EKS'] } },
      { id: 't9-4', type: 'system', position: { x: 660, y: 360 }, data: { label: 'Monitoring', nodeType: 'monitoring', description: 'Metrics & alerts', techStack: ['Prometheus', 'Grafana'] } },
      { id: 't9-5', type: 'system', position: { x: 100, y: 580 }, data: { label: 'API Service', nodeType: 'service', description: 'REST API pods', techStack: ['Go'] } },
      { id: 't9-6', type: 'system', position: { x: 380, y: 580 }, data: { label: 'Worker', nodeType: 'worker', description: 'Background jobs', techStack: ['Python'] } },
      { id: 't9-7', type: 'system', position: { x: 660, y: 580 }, data: { label: 'Logging', nodeType: 'logging', description: 'Log aggregation', techStack: ['ELK Stack'] } },
      { id: 't9-8', type: 'system', position: { x: 100, y: 780 }, data: { label: 'Database', nodeType: 'database', description: '', techStack: ['PostgreSQL'] } },
      { id: 't9-9', type: 'system', position: { x: 380, y: 780 }, data: { label: 'Queue', nodeType: 'queue', description: '', techStack: ['RabbitMQ'] } },
    ],
    edges: [
      { id: 't9-e1', source: 't9-1', target: 't9-2', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't9-e2', source: 't9-2', target: 't9-3', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'rest', label: '' } },
      { id: 't9-e3', source: 't9-3', target: 't9-4', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'system', data: { edgeType: 'tcp', label: 'Metrics' } },
      { id: 't9-e4', source: 't9-3', target: 't9-5', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't9-e5', source: 't9-3', target: 't9-6', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'grpc', label: '' } },
      { id: 't9-e6', source: 't9-4', target: 't9-7', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'tcp', label: 'Logs' } },
      { id: 't9-e7', source: 't9-5', target: 't9-8', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'db-query', label: '' } },
      { id: 't9-e8', source: 't9-6', target: 't9-9', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'system', data: { edgeType: 'pub-sub', label: '' } },
    ],
  },
];
