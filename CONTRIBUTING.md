# Contributing

Thanks for taking the time. Bug reports, ideas and pull requests are all welcome.
For anything bigger than a small fix, open an issue first so we can agree on the approach.

## Setup

```bash
nvm use                # Node version from .nvmrc (CI also runs 22 and 24; engines >= 22.12.0)
npm ci
npm run dev            # http://localhost:3000
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm test` | Vitest unit tests (`src/lib/*.test.ts`) |
| `npm run lint` | ESLint |
| `npm run build` | Static export to `./out` |

CI runs `lint`, `test` and `build` on Node 22, 24 and 26. Run all three before opening a PR.

## Project layout

```
src/
  app/            # Routes: / (landing), /projects (dashboard), /canvas, /canvas/shared, /import, /settings
  components/
    canvas/       # Canvas, toolbar, library, menus, dialogs, presentation mode
    nodes/        # BaseSystemNode (every component type), GroupNode, StickyNote, node-registry.ts
    edges/        # SystemEdge (every connection type), editors, edge-registry.ts
    landing/      # Landing page sections
    project/      # Dashboard: project list, templates, import
    ui/           # Design-system primitives — build UI from these
  stores/         # Zustand stores (canvas, projects, settings, toasts)
  lib/            # Pure logic: storage, share links, export, auto-layout, templates, validation
  types/index.ts  # Types and Zod schemas
  styles/tokens.css  # Studio design tokens (light / dark)
```

Things to know:

- **Static export only.** No route handlers, dynamic segments or server-only APIs. Pass ids as query params (`canvasPath(id)` in `lib/routes.ts`).
- **localStorage is the only persistence.** Changes to stored data must keep existing projects loading; schemas live in `types/index.ts`.
- **Handle ids are persisted** (`{top|right|bottom|left}-{source|target}`); don't rename them.
- **Styling uses Studio tokens** (`bg`, `paper`, `ink`, `line`, `accent`, …). Don't use `gray-*`/`slate-*`/`zinc-*` or shadcn's `muted`/`primary` names.

`CLAUDE.md` has the longer architecture notes.

## Adding a component type

1. Add the id to `SYSTEM_NODE_TYPES` in `src/types/index.ts`.
2. Add an entry to `NODE_REGISTRY` in `src/components/nodes/node-registry.ts` (label, lucide icon, color, category, default and suggested tech). TypeScript fails until this exists.
3. Add a minimap color in `src/lib/minimap.ts`.
4. Optional: a Mermaid shape in `src/lib/mermaid.ts` and image-name patterns in `src/lib/docker-compose.ts`.

Connection types work the same way: `SYSTEM_EDGE_TYPES` in `types/index.ts` plus `EDGE_REGISTRY` in `src/components/edges/edge-registry.ts`.

## Adding a template

Add an object to `TEMPLATES` in `src/lib/templates.ts` (unique `id`, unique node/edge ids, valid handle ids). `src/lib/auto-layout.test.ts` runs every template through auto-layout, so `npm test` checks it.

## Commits and pull requests

- Small commits with [Conventional Commits](https://www.conventionalcommits.org/) messages: `feat(canvas): …`, `fix(share): …`, `chore(deps): …`, `docs: …`.
- One topic per PR. Describe what changed and why; add a screenshot for UI changes (light and dark if colors change).
- Add or update tests for logic in `src/lib/`.

PR checklist:

- [ ] `npm run lint`, `npm test` and `npm run build` pass
- [ ] Existing saved projects and share links still load
- [ ] UI changes checked in light and dark theme and on a narrow screen
- [ ] README / CLAUDE.md updated if behaviour or structure changed

## License

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
