# CLAUDE.md — System Design Canvas

## What is System Design Canvas

System Design Canvas is an opinionated canvas tool for software engineers to think about, plan, and visualize system architectures. No auth, no backend — runs entirely on localStorage.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
```

## Tech Stack

- Next.js 15 (App Router, Turbopack) + TypeScript
- @xyflow/react v12 (canvas engine)
- Zustand (state management)
- Tailwind CSS v4 + shadcn/ui
- html-to-image (PNG/SVG export)
- Zod (localStorage data validation)
- lucide-react (icons)
- No backend, no auth, no database

## Architecture

### Data Flow
- **localStorage** is the only persistence layer — versioned schema under the `system-design-canvas` key
- Auto-save: debounced 500ms + beforeunload
- Path alias: `@/*` → `./src/*`

### State Management
- **useProjectStore** — project CRUD (loadProjects, createProject, deleteProject, renameProject, saveProject)
- **useCanvasStore** — active canvas (nodes, edges, viewport, undo/redo, selectedNodeId)
- Every mutation writes to localStorage
- React Flow **controlled mode** — Zustand is the single source of truth

### Key Architecture Decisions
1. **Single custom node component**: BaseSystemNode renders all node types. Differences come from node-registry.ts.
2. **Single custom edge component**: SystemEdge renders all edge types. Differences come from edge-registry.ts.
3. **React Flow controlled mode**: Nodes/edges live in Zustand, applyNodeChanges/applyEdgeChanges run inside the store.
4. **localStorage**: Single key, versioned schema, ~5MB limit = ~100 projects comfortably.
5. **Export**: html-to-image converts .react-flow div → PNG/SVG at 2x pixel ratio.

## Data Model

```typescript
// Node types
SystemNodeType: 'service' | 'database' | 'cache' | 'queue' | 'load-balancer' | 'client' | 'cdn' | 'api-gateway'

// Edge types
SystemEdgeType: 'rest' | 'grpc' | 'websocket' | 'pub-sub' | 'tcp' | 'db-query'

SystemNodeData { label, nodeType, description, techStack: string[] }
SystemEdgeData { edgeType, label }
Project { id, name, description, createdAt, updatedAt, nodes, edges, viewport }
AppData { version: number, projects: Project[], lastOpenedProjectId }
```

## Node Registry

| Type | Icon | Color | Default Tech |
|------|------|-------|-------------|
| service | Server | Blue | — |
| database | Database | Green | PostgreSQL |
| cache | Zap | Amber | Redis |
| queue | MessageSquare | Pink | RabbitMQ |
| load-balancer | Scale | Indigo | Nginx |
| client | Monitor | Purple | — |
| cdn | Globe | Teal | CloudFront |
| api-gateway | Shield | Red | — |

## Edge Registry

| Type | Color | Stroke | Animated |
|------|-------|--------|----------|
| rest | Blue | Solid | No |
| grpc | Green | Solid | No |
| websocket | Purple | Dash 5-5 | Yes |
| pub-sub | Pink | Dash 8-4 | Yes |
| tcp | Gray | Solid | No |
| db-query | Green | Dash 3-3 | No |

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout
    page.tsx                # Dashboard (project list)
    globals.css
    canvas/
      [id]/
        page.tsx            # Canvas page
  components/
    canvas/
      Canvas.tsx            # Main React Flow wrapper + orchestrator
      CanvasToolbar.tsx     # Bottom toolbar (add node, zoom, export, undo/redo)
      NodePalette.tsx       # Left sidebar — draggable node types
    nodes/
      BaseSystemNode.tsx    # Single custom node component (all types)
      NodeEditor.tsx        # Right panel — node detail editing
      node-registry.ts      # Node type definitions (icon, color, defaults)
    edges/
      SystemEdge.tsx        # Single custom edge component (all types)
      EdgeTypeSelector.tsx  # Connection type selection popover
      edge-registry.ts      # Edge type definitions (color, stroke style)
    project/
      ProjectCard.tsx
      ProjectList.tsx
      ProjectModal.tsx      # Create/rename dialog
      TemplateSelector.tsx
    ui/                     # shadcn/ui components
    layout/
      Header.tsx
  stores/
    useCanvasStore.ts       # Active canvas state
    useProjectStore.ts      # Project list CRUD
  hooks/
    useAutoSave.ts          # Debounced localStorage save
    useKeyboardShortcuts.ts
  lib/
    storage.ts              # localStorage read/write/migrate
    export.ts               # PNG/SVG export functions
    templates.ts            # Template data (pure data)
    utils.ts                # cn() helper
  types/
    index.ts                # All types and Zod schemas
```

## Templates

1. **Microservices** — Client > LB > API Gateway > 3 Services > 2 DBs + Queue
2. **Monolith** — Client > LB > Monolith Service > DB + Cache
3. **Event-Driven** — Producers > Event Bus > Consumers > DBs
4. **Client-Server** — Client > CDN > API Server > DB + Cache
