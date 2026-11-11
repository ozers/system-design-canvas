# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - Unreleased

First tagged release. Covers everything since the project started in February 2026.

### Added

- **Landing page** at `/`: the hero renders real templates with the app's own node and edge components, auto-laid out, with one button to open the shown template as a project. Returning visitors with saved projects go straight to the dashboard (`/?home` keeps the landing).
- **Studio design system**: warm-neutral OKLCH tokens, light / dark / system theme, pill controls, floating library and editor panels, single toolbar pill; bottom sheet and drawers on narrow screens.
- ⌘K command menu, `?` shortcuts dialog, onboarding, settings page, toasts.
- **Presentation mode**: walks the diagram one component at a time with a story card per node.
- **Design checks**: flags disconnected components, likely bottlenecks and missing tech stacks.
- **Auto-layout** with dagre: facing handles and fewer crossings.
- 19 component types, 9 connection types (REST, gRPC, GraphQL, WebSocket, Pub/Sub, MQTT, SSE, TCP, DB Query), groups and sticky notes; 9 templates.
- Node and connection editors: tech stack with suggestions, status, environment, owner, links, latency / format / throughput, reverse direction.
- **Export** to PNG (1×–3×, transparent background), SVG, JSON and Mermaid; **share links** that carry the whole design in the URL fragment (`/canvas/shared#d=…`, never sent to the host), with a preview page before saving a copy.
- **Import** of project JSON, API endpoint lists and `docker-compose.yml` (node types detected from image names).
- **Cloudflare Workers** static hosting and an opt-in flow that moves projects and settings from an old origin to a new one (`NEXT_PUBLIC_MIGRATE_TO`).
- SEO: canonical URL, Open Graph / Twitter metadata, `sitemap.xml` and `robots.txt`.
- Edges draw an arrowhead in their own stroke color, so connection direction is visible on the canvas.
- `/projects` shows a notice when stored projects could not be read and were kept aside, with a **Download backup** button (quarantined entries plus the raw backup as JSON).
- Vitest unit tests (storage, share links, auto-layout for every template, docker-compose parsing, routes), run in CI.

### Changed

- The dashboard moved from `/` to `/projects`.
- Supported Node.js versions are the LTS lines 22, 24 and 26 (`engines` >= 22.12.0); `.nvmrc` pins 26. Node 20 is no longer supported.
- Dependencies: Next.js 16.4, React 19.3, @dagrejs/dagre 3, lucide-react 1.x, js-yaml 5, shadcn CLI 4, Vitest 5, and in-range updates of React Flow, Radix, Zod, Zustand, Tailwind and Wrangler. Auto-layout output is identical on dagre 3.

### Fixed

- **Storage safety**: an invalid saved project is moved to a quarantine key and the others still load, instead of resetting everything. The raw stored value is backed up before anything is dropped, and unreadable storage is never overwritten with an empty list.
- **Share link validation**: decoded links are checked against the node and edge schemas (unique ids, edges pointing at existing nodes); invalid links show a clear message instead of saving a broken project.
- **Connection direction**: a connection dragged from A to B could be saved as B → A (the drag grabbed the invisible opposite handle), which broke design checks, auto-layout, Mermaid export and presentation order. New edges now follow the drag direction; saved projects and templates are unchanged.
- **Unknown project ids**: `/canvas?id=<unknown>` showed an editable canvas that said "Saved" while nothing was written. It now shows a "Project not found" state, and a save without a project reports "Not saved".
- **Undo**: deleting a multi-selection is one undo step (it took up to 8, through states that never existed); undo no longer skips a step and redo no longer loses the latest change.
- **Share link privacy**: links used a `?d=` query parameter, so the design reached the host in the request line. New links use the URL fragment; old `?d=` links still open and are rewritten to the fragment form.
- `docker-compose.yml` files that use YAML merge keys (`<<`) import correctly with js-yaml 5.
- Security advisories in Next.js and Zod closed by the dependency updates.

[1.0.0]: https://github.com/ozers/system-design-canvas/releases/tag/v1.0.0
