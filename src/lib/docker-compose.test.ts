import { describe, expect, it } from 'vitest';
import { parseDockerCompose } from './docker-compose';

const compose = `
x-defaults: &defaults
  restart: unless-stopped
  depends_on:
    - db

services:
  api:
    <<: *defaults
    build: ./api
  worker:
    <<: *defaults
    image: node:22
  db:
    image: postgres:16
  cache:
    image: redis:7
`;

describe('parseDockerCompose', () => {
  it('creates a node per service with detected types', () => {
    const { nodes } = parseDockerCompose(compose);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n.data.nodeType]));
    expect(Object.keys(byId).sort()).toEqual(['dc-api', 'dc-cache', 'dc-db', 'dc-worker']);
    expect(byId['dc-db']).toBe('database');
    expect(byId['dc-cache']).toBe('cache');
  });

  it('resolves `<<` merge keys from anchors', () => {
    const { edges } = parseDockerCompose(compose);
    const pairs = edges.map((e) => `${e.source}->${e.target}`);
    expect(pairs).toContain('dc-api->dc-db');
    expect(pairs).toContain('dc-worker->dc-db');
  });

  it('rejects files without services', () => {
    expect(() => parseDockerCompose('')).toThrow(/no services/);
    expect(() => parseDockerCompose('version: "3"\n')).toThrow(/no services/);
  });
});
