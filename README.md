# System Design Canvas

Think through your system architecture before you build it.

System Design Canvas is a free, open-source visual tool that helps software engineers sketch out system designs quickly. Drop components onto a canvas, wire them together, and see your architecture take shape -- all in the browser, no sign-up required.

Your work is saved automatically to localStorage. No servers, no accounts, no data leaving your machine.

## Why?

Most system design happens on whiteboards that get erased, or in docs that nobody reads. We wanted something in between -- a focused tool where you can think visually about services, databases, queues, and how they connect, without the overhead of a full diagramming suite.

System Design Canvas is opinionated by design. Instead of giving you a blank canvas with infinite shape options, it gives you the building blocks that actually matter in system design: **8 component types** and **6 connection types** that map directly to real infrastructure patterns.

## What You Can Do

**Start fast** -- Pick from 6 ready-made templates (Microservices, Monolith, Event-Driven, Client-Server, Serverless, Data Pipeline) or start from scratch.

**Build visually** -- Drag components from the palette: Services, Databases, Caches, Message Queues, Load Balancers, Clients, CDNs, and API Gateways. Connect them with typed edges like REST, gRPC, WebSocket, Pub/Sub, TCP, or DB Query.

**Stay organized** -- Auto-layout arranges your nodes cleanly. Resize nodes, add sticky notes, snap to grid. Undo/redo everything.

**Document and share** -- Export your design as PNG or SVG. Every component can have a description and tech stack tags (e.g. "PostgreSQL", "Redis", "Go").

**Work anywhere** -- Responsive design works on desktop and tablets. Dark mode included. Keyboard shortcuts for everything (press `?` to see them all).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create your first project.

## Templates

| Template | Architecture |
|----------|-------------|
| Microservices | Client > Load Balancer > API Gateway > Services > DBs + Queue |
| Monolith | Client > Load Balancer > Monolith > DB + Cache |
| Event-Driven | Producers > Event Bus > Consumers > DBs |
| Client-Server | Client > CDN > API Server > DB + Cache |
| Serverless | Client > API Gateway > Lambda Functions > DynamoDB + S3 |
| Data Pipeline | Data Sources > Kafka > Stream Processors > Warehouse + Analytics |

## Built With

Next.js 15, TypeScript, [React Flow](https://reactflow.dev), Zustand, Tailwind CSS v4, shadcn/ui, dagre, html-to-image.

## Development

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # Lint
```

## License

MIT
