# CLAUDE.md — System Design Canvas

## What is System Design Canvas

System Design Canvas, yazılımcıların sistem mimarisi düşünmesi, planlaması ve görselleştirmesi için opinionated bir canvas aracıdır. Auth yok, backend yok, localStorage ile çalışır.

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
- Zod (localStorage veri validasyonu)
- lucide-react (ikonlar)
- Backend yok, auth yok, veritabanı yok

## Architecture

### Data Flow
- **localStorage** tek persistence katmanı — `system-design-canvas` key'i altında versiyonlu schema
- Auto-save: debounced 500ms + beforeunload
- Path alias: `@/*` → `./src/*`

### State Management
- **useProjectStore** — proje CRUD (loadProjects, createProject, deleteProject, renameProject, saveProject)
- **useCanvasStore** — aktif canvas (nodes, edges, viewport, undo/redo, selectedNodeId)
- Her mutasyonda localStorage'a yazar
- React Flow **controlled mode** — Zustand tek source of truth

### Key Architecture Decisions
1. **Tek custom node componenti**: BaseSystemNode tüm 8 node tipini render eder. Fark node-registry.ts'den gelir.
2. **Tek custom edge componenti**: SystemEdge tüm 6 edge tipini render eder. Fark edge-registry.ts'den gelir.
3. **React Flow controlled mode**: Nodes/edges Zustand'da, applyNodeChanges/applyEdgeChanges store içinde.
4. **localStorage**: Tek key, versiyonlu schema, ~5MB limit = ~100 proje rahat.
5. **Export**: html-to-image ile .react-flow div → PNG/SVG, 2x pixel ratio.

## Data Model

```typescript
// 8 node tipi
SystemNodeType: 'service' | 'database' | 'cache' | 'queue' | 'load-balancer' | 'client' | 'cdn' | 'api-gateway'

// 6 edge tipi
SystemEdgeType: 'rest' | 'grpc' | 'websocket' | 'pub-sub' | 'tcp' | 'db-query'

SystemNodeData { label, nodeType, description, techStack: string[] }
SystemEdgeData { edgeType, label }
Project { id, name, description, createdAt, updatedAt, nodes, edges, viewport }
AppData { version: number, projects: Project[], lastOpenedProjectId }
```

## Node Registry

| Tip | İkon | Renk | Varsayılan Tech |
|-----|------|------|-----------------|
| service | Server | Blue | — |
| database | Database | Green | PostgreSQL |
| cache | Zap | Amber | Redis |
| queue | MessageSquare | Pink | RabbitMQ |
| load-balancer | Scale | Indigo | Nginx |
| client | Monitor | Purple | — |
| cdn | Globe | Teal | CloudFront |
| api-gateway | Shield | Red | — |

## Edge Registry

| Tip | Renk | Çizgi | Animasyon |
|-----|------|-------|-----------|
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
    page.tsx                # Dashboard (proje listesi)
    globals.css
    canvas/
      [id]/
        page.tsx            # Canvas sayfası
  components/
    canvas/
      Canvas.tsx            # Ana React Flow wrapper + orchestrator
      CanvasToolbar.tsx     # Alt toolbar (node ekle, zoom, export, undo/redo)
      NodePalette.tsx       # Sol sidebar — sürüklenebilir node tipleri
    nodes/
      BaseSystemNode.tsx    # Tek custom node component (tüm tipler)
      NodeEditor.tsx        # Sağ panel — node detay düzenleme
      node-registry.ts      # Node tip tanımları (ikon, renk, varsayılanlar)
    edges/
      SystemEdge.tsx        # Tek custom edge component (tüm tipler)
      EdgeTypeSelector.tsx  # Bağlantı çekerken tip seçimi popover
      edge-registry.ts      # Edge tip tanımları (renk, çizgi stili)
    project/
      ProjectCard.tsx
      ProjectList.tsx
      ProjectModal.tsx      # Oluştur/yeniden adlandır dialog
      TemplateSelector.tsx
    ui/                     # shadcn/ui bileşenleri
    layout/
      Header.tsx
  stores/
    useCanvasStore.ts       # Aktif canvas state
    useProjectStore.ts      # Proje listesi CRUD
  hooks/
    useAutoSave.ts          # Debounced localStorage kayıt
    useKeyboardShortcuts.ts
  lib/
    storage.ts              # localStorage read/write/migrate
    export.ts               # PNG/SVG export fonksiyonları
    templates.ts            # Şablon verileri (pure data)
    utils.ts                # cn() helper
  types/
    index.ts                # Tüm tipler ve Zod şemaları
```

## Templates (4)

1. **Microservices** — Client > LB > API Gateway > 3 Service > 2 DB + Queue
2. **Monolith** — Client > LB > Monolith Service > DB + Cache
3. **Event-Driven** — Producers > Event Bus > Consumers > DBs
4. **Client-Server** — Client > CDN > API Server > DB + Cache

## Implementation Order

### Hafta 1: Core (Steps 1-9)
1. ~~Project setup + deps + shadcn init~~ (DONE)
2. `src/types/index.ts` — veri modeli + Zod schemas
3. `node-registry.ts` + `edge-registry.ts`
4. `src/lib/storage.ts` — localStorage katmanı
5. `useProjectStore` + `useCanvasStore`
6. `BaseSystemNode` + `SystemEdge` components
7. `Canvas.tsx` — React Flow entegrasyonu
8. Dashboard sayfası — proje listesi + oluştur/sil
9. Auto-save hook'u

### Hafta 2: Features + Polish (Steps 10-17)
10. NodeEditor — node düzenleme paneli
11. EdgeTypeSelector — bağlantı tipi seçimi
12. NodePalette — drag-and-drop node ekleme
13. Şablonlar (4 adet)
14. Export (PNG/SVG)
15. Undo/redo
16. Keyboard shortcuts
17. Landing/header polish

## Verification Checklist
1. `npm run build` — hatasız build
2. `npm run lint` — hatasız lint
3. Dashboard: proje oluştur, listele, sil, yeniden adlandır
4. Canvas: node ekle (her 8 tip), taşı, düzenle, sil
5. Canvas: edge çiz (her 6 tip), etiket düzenle, sil
6. Şablon: her 4 şablondan proje oluştur
7. Export: PNG ve SVG indir
8. Undo/redo: 3+ işlem geri al, ileri al
9. Sayfa yenile: tüm verinin localStorage'dan geri yüklendiğini doğrula
