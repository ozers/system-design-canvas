import { DESIGN_FORMAT, type Design } from './ai-format';
import type { BriefCheck } from './brief-checks';
import type { SystemNodeType } from '@/types';

/** A practice problem: requirements, a checklist, hints and one reference design. Pure data. */
export interface Brief {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  /** One sentence for the card and the top of the panel. */
  summary: string;
  requirements: string[];
  /** Load and size figures to design for. */
  scale: string[];
  checks: BriefCheck[];
  /** Revealed one at a time. */
  hints: string[];
  /** One reasonable answer, not the only one. */
  reference: Design;
}

const ENTRY: BriefCheck = {
  id: 'entry',
  kind: 'via',
  label: 'Clients reach a service through a load balancer, gateway or CDN',
  from: ['client'],
  via: ['load-balancer', 'api-gateway', 'cdn'],
  to: ['service', 'serverless', 'container-cluster'],
};

const CLEAN: BriefCheck = { id: 'clean', kind: 'clean', label: 'Every component is connected to something' };

const COMPUTE: SystemNodeType[] = ['service', 'serverless', 'container-cluster'];

export const BRIEFS: Brief[] = [
  {
    id: 'url-shortener',
    title: 'URL shortener',
    difficulty: 'easy',
    tags: ['read-heavy', 'caching'],
    summary: 'Turn long links into short ones and redirect quickly.',
    requirements: [
      'Create a short link for any URL.',
      'Opening a short link redirects to the original URL.',
      'A short link never changes once it is created.',
      'Each link shows a click count; it may lag by a minute.',
    ],
    scale: ['100 million new links a month', '100 redirects for every new link', 'Redirects answer in under 50 ms'],
    checks: [
      ENTRY,
      { id: 'store', kind: 'linked', label: 'A service stores links in a database', a: COMPUTE, b: ['database'] },
      { id: 'cache', kind: 'linked', label: 'Redirects can be answered from a cache', a: COMPUTE, b: ['cache'] },
      {
        id: 'clicks',
        kind: 'via',
        label: 'Click counting goes through a queue or stream, off the redirect path',
        from: COMPUTE,
        via: ['queue', 'stream'],
        to: ['worker', 'serverless'],
      },
      CLEAN,
    ],
    hints: [
      'Redirects outnumber writes 100 to 1. What does the read path need so it rarely touches the database?',
      'Counting a click must not slow the redirect down. Hand it to something that can be processed later.',
      'Short codes must be unique. Decide where they are generated: a counter, a key service or a hash with a retry.',
    ],
    reference: {
      format: DESIGN_FORMAT,
      nodes: [
        { id: 'client', type: 'client', label: 'Browser', tech: [] },
        { id: 'lb', type: 'load-balancer', label: 'Load balancer', tech: ['Nginx'] },
        { id: 'api', type: 'service', label: 'Link service', tech: ['Go'], description: 'Creates links and answers redirects.' },
        { id: 'cache', type: 'cache', label: 'Link cache', tech: ['Redis'], description: 'Short code to URL, for hot links.' },
        { id: 'db', type: 'database', label: 'Links', tech: ['DynamoDB'], description: 'Keyed by short code.' },
        { id: 'clicks', type: 'stream', label: 'Click events', tech: ['Kafka'] },
        { id: 'counter', type: 'worker', label: 'Click counter', tech: [], description: 'Adds clicks up in batches.' },
        { id: 'stats', type: 'database', label: 'Click counts', tech: ['ClickHouse'] },
      ],
      edges: [
        { from: 'client', to: 'lb', protocol: 'rest', label: 'HTTPS' },
        { from: 'lb', to: 'api', protocol: 'rest' },
        { from: 'api', to: 'cache', protocol: 'db-query', label: 'lookup' },
        { from: 'api', to: 'db', protocol: 'db-query', label: 'on miss' },
        { from: 'api', to: 'clicks', protocol: 'pub-sub', label: 'clicked' },
        { from: 'clicks', to: 'counter', protocol: 'event-stream' },
        { from: 'counter', to: 'stats', protocol: 'db-query' },
      ],
    },
  },
  {
    id: 'rate-limiter',
    title: 'API rate limiter',
    difficulty: 'medium',
    tags: ['gateway', 'shared state'],
    summary: 'Cap how many requests each API key may send.',
    requirements: [
      'Each API key gets a limit per minute; requests over it get a 429.',
      'The limit holds across every gateway instance, not per instance.',
      'Limits can be changed without a deploy.',
      'If the limiter itself breaks, traffic still flows.',
    ],
    scale: ['50,000 requests a second at peak', '1 million API keys', 'The check adds at most a few milliseconds'],
    checks: [
      {
        id: 'gateway',
        kind: 'via',
        label: 'Requests pass a gateway before they reach a service',
        from: ['client'],
        via: ['api-gateway'],
        to: COMPUTE,
      },
      { id: 'counters', kind: 'linked', label: 'The gateway keeps counters in a shared cache', a: ['api-gateway'], b: ['cache'] },
      { id: 'rules', kind: 'linked', label: 'Limits live in a database or a config service', a: ['api-gateway', 'service'], b: ['database'] },
      { id: 'watch', kind: 'linked', label: 'Rejected requests are visible in monitoring or logs', a: ['api-gateway'], b: ['monitoring', 'logging'] },
      CLEAN,
    ],
    hints: [
      'A counter kept in one gateway instance lets a caller multiply its limit by the number of instances.',
      'Reading and increasing a counter has to be one atomic step, or two requests can both slip through.',
      'Decide what happens when the counter store is down: block everything, or let traffic through.',
    ],
    reference: {
      format: DESIGN_FORMAT,
      nodes: [
        { id: 'client', type: 'client', label: 'API callers', tech: [] },
        { id: 'lb', type: 'load-balancer', label: 'Load balancer', tech: ['Nginx'] },
        { id: 'gw', type: 'api-gateway', label: 'Gateway', tech: ['Envoy'], description: 'Checks the limit, then forwards.' },
        { id: 'counters', type: 'cache', label: 'Counters', tech: ['Redis'], description: 'One atomic increment per request.' },
        { id: 'rules', type: 'database', label: 'Limit rules', tech: ['PostgreSQL'], description: 'Read rarely, cached in the gateway.' },
        { id: 'api', type: 'service', label: 'Orders API', tech: [] },
        { id: 'metrics', type: 'monitoring', label: 'Metrics', tech: ['Prometheus'], description: 'Allowed and rejected, per key.' },
      ],
      edges: [
        { from: 'client', to: 'lb', protocol: 'rest', label: 'HTTPS' },
        { from: 'lb', to: 'gw', protocol: 'rest' },
        { from: 'gw', to: 'counters', protocol: 'db-query', label: 'INCR' },
        { from: 'gw', to: 'rules', protocol: 'db-query' },
        { from: 'gw', to: 'api', protocol: 'rest' },
        { from: 'metrics', to: 'gw', protocol: 'rest', label: 'scrape' },
      ],
    },
  },
  {
    id: 'chat',
    title: 'Chat',
    difficulty: 'medium',
    tags: ['real-time', 'fan-out'],
    summary: 'One-to-one and group messages, delivered as they are sent.',
    requirements: [
      'A message reaches online recipients within a second.',
      'People who are offline get a push notification and see the message later.',
      'History is kept and loads in order.',
      'A group has up to 500 members.',
    ],
    scale: ['10 million people online at once', '40,000 messages a second', 'Each chat server holds about 100,000 open connections'],
    checks: [
      {
        id: 'socket',
        kind: 'linked',
        label: 'Clients hold a WebSocket connection',
        a: ['client'],
        b: ['load-balancer', 'api-gateway', 'service'],
        protocols: ['websocket'],
      },
      { id: 'history', kind: 'linked', label: 'Messages are stored in a database', a: COMPUTE, b: ['database'] },
      {
        id: 'between',
        kind: 'linked',
        label: 'Chat servers pass messages to each other through a queue, stream or pub/sub cache',
        a: COMPUTE,
        b: ['queue', 'stream', 'cache'],
      },
      {
        id: 'push',
        kind: 'via',
        label: 'Offline delivery runs in a worker behind a queue or stream',
        from: COMPUTE,
        via: ['queue', 'stream'],
        to: ['worker', 'serverless'],
      },
      CLEAN,
    ],
    hints: [
      'Sender and recipient are usually connected to different servers. How does a message get from one server to the other?',
      'Something has to know which server each person is connected to, and forget it when they disconnect.',
      'Sending a push notification calls a slow outside provider. Keep it away from the path that delivers messages.',
    ],
    reference: {
      format: DESIGN_FORMAT,
      nodes: [
        { id: 'client', type: 'client', label: 'Chat app', tech: [] },
        { id: 'lb', type: 'load-balancer', label: 'Load balancer', tech: [], description: 'Keeps each connection on one server.' },
        { id: 'chat', type: 'service', label: 'Chat servers', tech: ['Elixir'], description: 'Hold the open connections.' },
        { id: 'bus', type: 'cache', label: 'Presence and pub/sub', tech: ['Redis'], description: 'Who is on which server.' },
        { id: 'db', type: 'database', label: 'Messages', tech: ['Cassandra'], description: 'Partitioned by conversation.' },
        { id: 'jobs', type: 'queue', label: 'Push jobs', tech: ['SQS'] },
        { id: 'push', type: 'worker', label: 'Push sender', tech: [], description: 'Calls APNs and FCM, with retries.' },
      ],
      edges: [
        { from: 'client', to: 'lb', protocol: 'websocket' },
        { from: 'lb', to: 'chat', protocol: 'websocket' },
        { from: 'chat', to: 'bus', protocol: 'pub-sub' },
        { from: 'chat', to: 'db', protocol: 'db-query' },
        { from: 'chat', to: 'jobs', protocol: 'pub-sub', label: 'recipient offline' },
        { from: 'jobs', to: 'push', protocol: 'pub-sub' },
      ],
    },
  },
  {
    id: 'timeline',
    title: 'Home timeline',
    difficulty: 'hard',
    tags: ['fan-out', 'caching', 'media'],
    summary: 'Show each person the latest posts from the accounts they follow.',
    requirements: [
      'Posting is fast and never waits for followers to be updated.',
      'The home timeline loads in under 200 ms.',
      'A new post shows up for followers within a few seconds.',
      'Posts can carry images.',
    ],
    scale: ['300 million people a day', 'Timelines are read 100 times more often than posts are written', 'Some accounts have 50 million followers'],
    checks: [
      ENTRY,
      { id: 'posts', kind: 'linked', label: 'Posts are stored in a database', a: COMPUTE, b: ['database'] },
      { id: 'timeline', kind: 'linked', label: 'Timelines are read from a cache', a: COMPUTE, b: ['cache'] },
      {
        id: 'fanout',
        kind: 'via',
        label: 'Fan-out to followers runs in a worker behind a queue or stream',
        from: COMPUTE,
        via: ['queue', 'stream'],
        to: ['worker', 'serverless'],
      },
      { id: 'media', kind: 'linked', label: 'Images sit in object storage behind a CDN', a: ['cdn'], b: ['object-storage'] },
      CLEAN,
    ],
    hints: [
      'Building the timeline when it is read means one query per followed account. Building it when a post is written moves that work off the read.',
      'Writing a post into 50 million timelines takes a long time. Treat the largest accounts differently from everyone else.',
      'Images do not belong in the database or behind your own servers.',
    ],
    reference: {
      format: DESIGN_FORMAT,
      nodes: [
        { id: 'client', type: 'client', label: 'App', tech: [] },
        { id: 'cdn', type: 'cdn', label: 'CDN', tech: ['CloudFront'] },
        { id: 'lb', type: 'load-balancer', label: 'Load balancer', tech: [] },
        { id: 'post', type: 'service', label: 'Post service', tech: [] },
        { id: 'read', type: 'service', label: 'Timeline service', tech: [], description: 'Merges in posts from the largest accounts at read time.' },
        { id: 'db', type: 'database', label: 'Posts', tech: ['PostgreSQL'] },
        { id: 'events', type: 'stream', label: 'New posts', tech: ['Kafka'] },
        { id: 'fanout', type: 'worker', label: 'Fan-out worker', tech: [], description: 'Adds the post id to each follower timeline.' },
        { id: 'cache', type: 'cache', label: 'Timelines', tech: ['Redis'], description: 'A list of post ids per person.' },
        { id: 'media', type: 'object-storage', label: 'Images', tech: ['S3'] },
      ],
      edges: [
        { from: 'client', to: 'lb', protocol: 'rest', label: 'HTTPS' },
        { from: 'client', to: 'cdn', protocol: 'rest', label: 'images' },
        { from: 'cdn', to: 'media', protocol: 'rest' },
        { from: 'lb', to: 'post', protocol: 'rest' },
        { from: 'lb', to: 'read', protocol: 'rest' },
        { from: 'post', to: 'db', protocol: 'db-query' },
        { from: 'post', to: 'media', protocol: 'rest', label: 'upload' },
        { from: 'post', to: 'events', protocol: 'pub-sub' },
        { from: 'events', to: 'fanout', protocol: 'event-stream' },
        { from: 'fanout', to: 'cache', protocol: 'db-query' },
        { from: 'read', to: 'cache', protocol: 'db-query' },
        { from: 'read', to: 'db', protocol: 'db-query', label: 'post bodies' },
      ],
    },
  },
  {
    id: 'upload-pipeline',
    title: 'File upload and processing',
    difficulty: 'medium',
    tags: ['async', 'storage'],
    summary: 'Accept large uploads and process them in the background.',
    requirements: [
      'Files of up to 5 GB can be uploaded.',
      'Each upload gets thumbnails and a virus scan before it can be downloaded.',
      'The uploader can see whether processing is pending, done or failed.',
      'Downloads are fast everywhere.',
    ],
    scale: ['2 million uploads a day', 'Uploads come in bursts of 10 times the average', 'Processing one file takes up to a minute'],
    checks: [
      { id: 'storage', kind: 'has', label: 'Files are kept in object storage', types: ['object-storage'] },
      {
        id: 'async',
        kind: 'via',
        label: 'Processing runs in a worker behind a queue or stream',
        from: ['service', 'serverless', 'container-cluster', 'object-storage'],
        via: ['queue', 'stream'],
        to: ['worker', 'serverless'],
      },
      { id: 'worker-storage', kind: 'linked', label: 'The worker reads and writes object storage', a: ['worker', 'serverless'], b: ['object-storage'] },
      { id: 'status', kind: 'linked', label: 'Processing status is stored in a database', a: ['service', 'serverless', 'container-cluster', 'worker'], b: ['database'] },
      { id: 'download', kind: 'linked', label: 'Downloads go through a CDN in front of object storage', a: ['cdn'], b: ['object-storage'] },
      CLEAN,
    ],
    hints: [
      'A 5 GB request passing through your API servers ties one up for minutes. Can the client send the file somewhere else directly?',
      'A burst of uploads should fill a buffer, not knock over the processors.',
      'A job can fail halfway or run twice. Make each step safe to repeat and record the outcome.',
    ],
    reference: {
      format: DESIGN_FORMAT,
      nodes: [
        { id: 'client', type: 'client', label: 'Uploader', tech: [] },
        { id: 'api', type: 'service', label: 'Upload API', tech: [], description: 'Hands out signed upload URLs and reports status.' },
        { id: 'files', type: 'object-storage', label: 'Files', tech: ['S3'] },
        { id: 'jobs', type: 'queue', label: 'Processing jobs', tech: ['SQS'], description: 'Filled by the storage "object created" event.' },
        { id: 'worker', type: 'worker', label: 'Processor', tech: [], description: 'Scans, then makes thumbnails.' },
        { id: 'db', type: 'database', label: 'Upload status', tech: ['PostgreSQL'] },
        { id: 'cdn', type: 'cdn', label: 'CDN', tech: ['CloudFront'] },
      ],
      edges: [
        { from: 'client', to: 'api', protocol: 'rest', label: 'start, status' },
        { from: 'client', to: 'files', protocol: 'rest', label: 'signed upload' },
        { from: 'api', to: 'db', protocol: 'db-query' },
        { from: 'files', to: 'jobs', protocol: 'pub-sub', label: 'object created' },
        { from: 'jobs', to: 'worker', protocol: 'pub-sub' },
        { from: 'worker', to: 'files', protocol: 'rest' },
        { from: 'worker', to: 'db', protocol: 'db-query', label: 'done / failed' },
        { from: 'client', to: 'cdn', protocol: 'rest', label: 'download' },
        { from: 'cdn', to: 'files', protocol: 'rest' },
      ],
    },
  },
  {
    id: 'notifications',
    title: 'Notification service',
    difficulty: 'medium',
    tags: ['async', 'reliability'],
    summary: 'Send email and push notifications on behalf of other teams.',
    requirements: [
      'Other services ask for a notification with one call and do not wait for it to be sent.',
      'Nobody gets the same notification twice.',
      'People can turn channels off; their choice is respected.',
      'An outage at the email provider does not delay push notifications.',
    ],
    scale: ['200 million notifications a day', 'Campaigns send 5 million in a few minutes', 'A failed send is retried for up to an hour'],
    checks: [
      {
        id: 'async',
        kind: 'via',
        label: 'Sending runs in workers behind a queue or stream',
        from: COMPUTE,
        via: ['queue', 'stream'],
        to: ['worker', 'serverless'],
      },
      { id: 'channels', kind: 'has', label: 'Each channel has its own worker', types: ['worker', 'serverless'], min: 2 },
      { id: 'prefs', kind: 'linked', label: 'Preferences are stored in a database', a: COMPUTE, b: ['database'] },
      { id: 'dedupe', kind: 'linked', label: 'A cache remembers what was already sent', a: ['worker', 'serverless', 'service'], b: ['cache'] },
      { id: 'watch', kind: 'has', label: 'Failures are visible in monitoring or logs', types: ['monitoring', 'logging'] },
      CLEAN,
    ],
    hints: [
      'A campaign and a password reset should not wait in the same line.',
      'Retries are what create duplicates. What tells a worker that a send already happened?',
      'One queue for every channel means a stuck email provider blocks push as well.',
    ],
    reference: {
      format: DESIGN_FORMAT,
      nodes: [
        { id: 'callers', type: 'service', label: 'Product services', tech: [] },
        { id: 'gw', type: 'api-gateway', label: 'Internal gateway', tech: [] },
        { id: 'notify', type: 'service', label: 'Notification service', tech: [], description: 'Checks preferences, picks channels, enqueues.' },
        { id: 'prefs', type: 'database', label: 'Preferences', tech: ['PostgreSQL'] },
        { id: 'email-q', type: 'queue', label: 'Email queue', tech: ['SQS'] },
        { id: 'push-q', type: 'queue', label: 'Push queue', tech: ['SQS'] },
        { id: 'email', type: 'worker', label: 'Email sender', tech: [] },
        { id: 'push', type: 'worker', label: 'Push sender', tech: [] },
        { id: 'sent', type: 'cache', label: 'Sent keys', tech: ['Redis'], description: 'One key per notification and channel.' },
        { id: 'metrics', type: 'monitoring', label: 'Metrics', tech: ['Prometheus'] },
      ],
      edges: [
        { from: 'callers', to: 'gw', protocol: 'rest' },
        { from: 'gw', to: 'notify', protocol: 'grpc' },
        { from: 'notify', to: 'prefs', protocol: 'db-query' },
        { from: 'notify', to: 'email-q', protocol: 'pub-sub' },
        { from: 'notify', to: 'push-q', protocol: 'pub-sub' },
        { from: 'email-q', to: 'email', protocol: 'pub-sub' },
        { from: 'push-q', to: 'push', protocol: 'pub-sub' },
        { from: 'email', to: 'sent', protocol: 'db-query' },
        { from: 'push', to: 'sent', protocol: 'db-query' },
        { from: 'metrics', to: 'email', protocol: 'rest', label: 'scrape' },
        { from: 'metrics', to: 'push', protocol: 'rest', label: 'scrape' },
      ],
    },
  },
];

const BY_ID = new Map(BRIEFS.map((brief) => [brief.id, brief]));

export function getBrief(id: string | null | undefined): Brief | undefined {
  return id ? BY_ID.get(id) : undefined;
}
