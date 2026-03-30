# DX-Ray Workspace

## Overview

DX-Ray is a developer experience diagnostic platform that acts like a medical X-ray scan for your dev workflow. It analyzes CI/CD pipelines, test health, code quality, PR review cycles, and documentation freshness — surfacing invisible friction and providing actionable insights.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS, Recharts, Framer Motion, shadcn/ui)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── dx-ray/             # React + Vite frontend (DX-Ray dashboard)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
```

## DX-Ray Features

### Pages
- **Landing** (`/`) — Marketing landing with animated scan metaphor
- **Dashboard** (`/dashboard`) — DX Score gauge, all track cards, recent insights
- **CI/CD Health** (`/dashboard/ci-cd`) — Build time trend, slowest steps, day-of-week heatmap
- **Test Health** (`/dashboard/test-health`) — Flaky test analysis, coverage by module
- **Code Quality** (`/dashboard/code-quality`) — Bug patterns, type safety score, top issues
- **PR Review Radar** (`/dashboard/pr-review`) — Review time trends, reviewer load, PR size analysis
- **Docs Freshness** (`/dashboard/docs`) — Staleness dashboard, most outdated docs
- **Insights** (`/dashboard/insights`) — AI-generated actionable recommendations with estimated hours saved
- **Before & After** (`/dashboard/before-after`) — Side-by-side improvement metrics showcase

### API Endpoints (all at /api)
- `GET /healthz` — Health check
- `GET/POST /repositories` — Manage repositories
- `GET/POST /scans` — Trigger and list scans
- `GET /metrics/overview` — DX score + track summary
- `GET /metrics/ci-cd` — CI/CD pipeline metrics
- `GET /metrics/test-health` — Test suite metrics
- `GET /metrics/code-quality` — Code quality metrics
- `GET /metrics/pr-review` — PR review metrics
- `GET /metrics/docs` — Documentation freshness metrics
- `GET /insights` — AI-generated insights
- `GET /before-after` — Before/after improvement comparison

## Database Schema

- `repositories` — tracked repos with DX score
- `scans` — scan history
- `insights` — AI-generated insight records

## Demo Data

3 demo repositories are seeded: acme-platform, acme-mobile, acme-data-pipeline.
All metrics are realistic demo data in the API route handlers.
