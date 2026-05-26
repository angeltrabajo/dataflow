# DataFlow

DataFlow is a data management application for organizing projects, tables, columns, and rows with support for formulas, references, CSV import/export, and more.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime

### Run the Development Server

```bash
bun run dev
```

The app will be available at `http://localhost:3000`.

### Lint

```bash
bun run lint
```

### Database

```bash
bun run db:push
```

## Architecture

DataFlow follows **Vertical Slice Architecture** — each feature is organized as a self-contained slice with its own Command, Handler, and Response types. This approach prioritizes:

- **Context auto-containment**: Each feature can be understood in isolation.
- **Low coupling, high cohesion**: Changes in one feature rarely affect others.
- **Linear, predictable flows**: Logic reads from input to output without indirection.

For the full architecture specification, see [docs/arquitectura-proyectos-ia.md](docs/arquitectura-proyectos-ia.md).

## Project Structure

```
src/
├── features/                      # Vertical slice features
│   ├── projects/                  # Project CRUD (4 slices)
│   ├── tables/                    # Table CRUD + reorder (4 slices)
│   ├── columns/                   # Column CRUD + reorder (4 slices)
│   ├── rows/                      # Row CRUD + batch (4 slices)
│   ├── formulas/                  # Formula evaluation (1 slice)
│   ├── data-portability/          # Import/Export CSV & ZIP (3 slices)
│   ├── navigation/                # View navigation (1 slice)
│   ├── theme/                     # Theme switching (1 slice)
│   └── undo/                      # Undo/Redo (2 slices)
│
├── shared/                        # Shared kernel
│   ├── domain/                    # Entity, ValueObject, DomainEvent, Repository
│   ├── types/                     # Result, Project, ViewType, Pagination
│   ├── utils/                     # id, date, format, validation, ref-helpers
│   └── infrastructure/            # database, logging, messaging
│
├── api/                           # API layer (thin adapters)
│   ├── routes/                    # Route adapters delegating to feature handlers
│   ├── dto/                       # API request/response DTOs
│   └── middleware/                 # CORS, error handling helpers
│
├── app/                           # Next.js App Router
│   ├── api/                       # Next.js API route handlers
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── globals.css                # Global styles
│
├── components/                    # UI components (shadcn/ui + custom)
├── lib/                           # Legacy utilities (store, helpers, csv-utils)
└── hooks/                         # Custom React hooks

tests/
├── integration/                   # Integration tests
└── e2e/                           # End-to-end tests

docs/                              # Project documentation
```

## Feature Slice Pattern

Each feature follows this canonical structure:

```
features/{verb}-{noun}/
├── {Verb}{Noun}Command.ts      # Input DTO with validation
├── {Verb}{Noun}Handler.ts      # Business logic handler
├── {Verb}{Noun}Response.ts     # Output DTO
└── index.ts                     # Public API barrel export
```

Handlers are pure functions that take a Command and current state, and return a Result with the new state. The Result pattern provides explicit error handling without exceptions.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with shadcn/ui
- **State Management**: Zustand
- **Database**: Prisma ORM (SQLite)
- **Charts**: Recharts
- **Animation**: Framer Motion
