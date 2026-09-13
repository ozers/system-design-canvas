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

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- @xyflow/react v12 (canvas engine)
- Zustand (state management)
- Tailwind CSS v4 + shadcn/ui (Radix primitives, restyled)
- html-to-image (PNG/SVG export), lz-string (share links), js-yaml (docker-compose import), dagre (auto-layout)
- Zod (localStorage data validation)
- lucide-react (icons), Geist + Geist Mono (fonts)
- No backend, no auth, no database

## Design System ("Studio")

- Tokens live in `src/styles/tokens.css` (OKLCH, light on `:root`, dark under `[data-theme="dark"]`) and are mapped to Tailwind colors in `globals.css`: `bg paper ink ink-2 ink-3 line line-2 accent accent-ink accent-soft dots ok warn danger note note-line`.
- Never use `gray-*`/`slate-*`/`zinc-*` or shadcn's `muted`/`primary`/`destructive`/`bg-card` names.
- Theme is the `data-theme` attribute on `<html>` (set by an inline head script, then kept in sync by `useApplyTheme`); `dark:` variant targets it.
- Component color (node registry hex) is used only for the icon, its tinted chip (`tint(color)`) and minimap; edges use `edgeStroke(color)` (`--edge-mix`). No colored node backgrounds.
- All controls are pills; surfaces use radius 6/9/12/14/16; elevation = 1px `line` border + `--shadow` / `--shadow-lg`. One accent-filled element per view.
- Mono font only for tech tags, ids, shortcuts, counts, sizes, code.
- Build UI from `src/components/ui/` (Button variants primary/secondary/ghost/toolbar/danger/danger-solid/icon, Input/Textarea/SearchInput, Tag, Kbd, Switch, Segmented, Panel, Dialog, Sheet, menus, Tooltip, Toast).

## Architecture

### Data Flow
- **localStorage** is the only persistence layer — versioned schema under the `system-design-canvas` key
- User settings persist separately under `sdc.settings` (rehydrated client-side in `Providers`)
- Auto-save: debounced 500ms + beforeunload; `saveStatus` is `saved | saving | error` (retries every 3s)
- Path alias: `@/*` → `./src/*`

### State Management
- **useProjectStore** — project CRUD (loadProjects, createProject, deleteProject, restoreProject, renameProject, duplicateProject, importProject(s), clearAllProjects, saveProject → boolean)
- **useCanvasStore** — active canvas (nodes, edges, viewport, undo/redo, selection) plus canvas chrome state (libraryCollapsed, command menu / shortcuts / export / share dialogs, presentation `{active, index}`) and actions (duplicateNodes, groupSelection, alignSelection, toggleLock, bringToFront, reverseEdge, clearCanvas)
- **useSettingsStore** — theme (light/dark/system), snap, minimap, validation, animatedEdges
- **useToastStore** — `toast({ message, tone, icon, action })`, bottom-right stack of max 3
- React Flow **controlled mode** — Zustand is the single source of truth

### Key Architecture Decisions
1. **Single custom node component**: BaseSystemNode renders all component types. Differences come from node-registry.ts. Groups and sticky notes have their own node types.
2. **Single custom edge component**: SystemEdge renders all edge types. Differences come from edge-registry.ts.
3. **React Flow controlled mode**: Nodes/edges live in Zustand, applyNodeChanges/applyEdgeChanges run inside the store.
4. **Floating chrome**: library, node/edge editors and validation are floating panels over a full-width canvas; below 900px the library is a bottom sheet and editors are drawers (`useIsNarrow`).
5. **Dialogs read open state from the store**; global shortcuts are registered only in `useKeyboardShortcuts`. The shortcut list lives in `src/lib/shortcuts.ts` and feeds both the `?` modal and ⌘K.
6. **localStorage**: Single key, versioned schema, ~5MB limit = ~100 projects comfortably.
7. **Export**: html-to-image renders the diagram bounds of `.react-flow` → PNG/SVG (1–3×, optional transparent background); JSON and Mermaid are text exports.
8. **Share links** encode `{n: nodes, e: edges}` with LZString in `/canvas/shared?d=…`; the landing page previews before saving a copy.

## Data Model

```typescript
// Component types (+ 'group')
SystemNodeType: 'client' | 'cdn' | 'dns' | 'waf' | 'load-balancer' | 'api-gateway'
  | 'service' | 'worker' | 'serverless' | 'container-cluster'
  | 'database' | 'cache' | 'object-storage' | 'search-index'
  | 'queue' | 'stream' | 'scheduler' | 'logging' | 'monitoring' | 'group'

// Edge types
SystemEdgeType: 'rest' | 'grpc' | 'graphql' | 'websocket' | 'pub-sub' | 'mqtt' | 'event-stream' | 'tcp' | 'db-query'

SystemNodeData { label, nodeType, description?, story?, techStack: string[], status?, environment?, owner?, links? }
SystemEdgeData { edgeType, label?, description?, latency?, dataFormat?, throughput? }
Project { id, name, description, createdAt, updatedAt, nodes, edges, viewport }
AppData { version: number, projects: Project[], lastOpenedProjectId }
```

Handle ids are persisted: `{top|right|bottom|left}-{source|target}` — don't rename them.

## Node Registry

Categories: Client & Edge, Compute, Data, Async, Observability, Other. Each entry has `label`, `icon`, `color` (Tailwind 600 hex), `defaultTechStack`, `suggestedTech`, `category`.

| Type | Icon | Color | Default Tech |
|------|------|-------|-------------|
| client | Monitor | Purple | — |
| cdn | Globe | Teal | CloudFront |
| dns | Globe2 | Sky | Route 53 |
| waf | ShieldCheck | Orange | AWS WAF |
| load-balancer | Scale | Indigo | Nginx |
| api-gateway | Shield | Red | — |
| service | Server | Blue | — |
| worker | Cog | Slate | — |
| serverless | CloudLightning | Violet | AWS Lambda |
| container-cluster | Boxes | Cyan | Kubernetes |
| database | Database | Green | PostgreSQL |
| cache | Zap | Amber | Redis |
| object-storage | HardDrive | Emerald | S3 |
| search-index | Search | Yellow | Elasticsearch |
| queue | MessageSquare | Pink | RabbitMQ |
| stream | Radio | Rose | Kafka |
| scheduler | Clock | Stone | — |
| logging | ScrollText | Lime | ELK Stack |
| monitoring | Activity | Fuchsia | Prometheus |
| group | SquareDashed | Slate | — |

## Edge Registry

| Type | Label | Stroke | Animated |
|------|-------|--------|----------|
| rest | REST | Solid | No |
| grpc | gRPC | Solid | No |
| graphql | GraphQL | Solid | No |
| websocket | WebSocket | Dash 5-5 | Fast |
| pub-sub | Pub/Sub | Dash 8-4 | Fast |
| mqtt | MQTT | Dash 6-3 | Fast |
| event-stream | SSE | Dash 10-4 | Slow |
| tcp | TCP | Solid | No |
| db-query | DB Query | Dash 3-3 | No |

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout, fonts, theme head script, Providers
    page.tsx                # Dashboard
    globals.css             # Tailwind + token mapping, motion, React Flow overrides
    settings/page.tsx       # Settings (appearance, canvas, data, about)
    canvas/
      [id]/page.tsx         # Canvas page
      shared/page.tsx       # Share-link landing (preview → save copy)
  styles/
    tokens.css              # Studio design tokens (light/dark)
  components/
    providers.tsx           # Settings hydration, theme sync, tooltips, toaster
    layout/
      Header.tsx            # Dashboard/settings header
      CanvasHeader.tsx      # Canvas header: breadcrumb rename, save status, Present/Export/Share
    canvas/
      Canvas.tsx            # React Flow wrapper + orchestrator
      CanvasToolbar.tsx     # Bottom floating toolbar pill
      NodePalette.tsx       # Library panel / rail / bottom sheet
      CanvasContextMenu.tsx # Node, selection and pane menus
      SelectionActions.tsx  # Multi-select action pill
      EmptyCanvas.tsx       # Empty-state quick add
      ValidationPanel.tsx   # Design checks panel
      PresentationOverlay.tsx
      CommandMenu.tsx       # ⌘K
      ShortcutsDialog.tsx   # ?
      OnboardingOverlay.tsx
      ShareDialog.tsx
      ExportDialog.tsx
      AddComponentMenu.tsx, canvas-helpers.ts
    nodes/
      BaseSystemNode.tsx    # Single custom node component (all component types)
      GroupNode.tsx, StickyNote.tsx
      NodeEditor.tsx        # Floating node editor panel / drawer
      node-registry.ts
    edges/
      SystemEdge.tsx        # Single custom edge component + inline protocol picker
      ProtocolPicker.tsx, ConnectionTypePicker.tsx
      EdgeEditor.tsx        # Floating connection editor panel / drawer
      edge-registry.ts
    project/                # Dashboard: list, cards, template strip/grid, modals, import
    shared/MinimapThumb.tsx # SVG thumbnail of a design
    ui/                     # Design-system primitives (see Design System)
  stores/
    useCanvasStore.ts, useProjectStore.ts, useSettingsStore.ts, useToastStore.ts
  hooks/
    useAutoSave.ts, useKeyboardShortcuts.ts, useTheme.ts, useMediaQuery.ts
  lib/
    storage.ts              # localStorage read/write/migrate
    export.ts               # PNG/SVG/JSON export, clipboard
    share.ts                # Share URL encode/decode
    mermaid.ts, docker-compose.ts, auto-layout.ts
    templates.ts            # Template data (pure data)
    shortcuts.ts            # Shortcut list (modal + command menu)
    validation.ts           # Design checks
    minimap.ts, node-factory.ts, utils.ts
  types/
    index.ts                # All types and Zod schemas
```

## Templates

1. **Microservices** — Client > LB > API Gateway > Services > DBs + Queue
2. **Monolith** — Client > LB > Monolith Service > DB + Cache
3. **Event-Driven** — Producers > Event Bus > Consumers > DBs
4. **Client-Server** — Client > CDN > API Server > DB + Cache
5. **Serverless** — Client > API Gateway > Lambda > DynamoDB + S3
6. **Data Pipeline** — Sources > Kafka > Processors > Warehouse + Analytics
7. **Real-time Analytics** — LB > Ingest API > Kafka > Stream Processing + Search
8. **Serverless Fullstack** — CDN > API Gateway > Lambda > DynamoDB + S3 + SQS + Logging
9. **Kubernetes Platform** — Ingress > K8s Cluster > Services + Monitoring + Logging
