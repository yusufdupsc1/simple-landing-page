# scholaOps

[![CI / CD](https://github.com/yusufdupsc1/ScholaOps/actions/workflows/ci.yml/badge.svg)](https://github.com/yusufdupsc1/ScholaOps/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

Multi-tenant school operations platform for modern institutions.

scholaOps is a production-oriented fullstack application that manages academics, attendance, finance, users, and school communications in one system. The codebase is intentionally structured to demonstrate end-to-end engineering ownership: domain modeling, secure auth, operational readiness, and CI/CD automation.

## Why This Repository Is Strong

- Multi-tenant data model with institution-level isolation in Prisma.
- Fullstack architecture using Next.js App Router, Server Actions, API routes, and middleware.
- Role-aware access control with Auth.js v5 + JWT claims.
- Production guardrails: strict type checks, linting, build gating, Docker runtime, and CI pipeline.
- Security-first defaults: CSP, HSTS, permissions policy, input validation, and environment validation.

## Product Scope

- Institution management: organization profile, settings, plans.
- Academic operations: classes, subjects, timetable, grades, attendance.
- People and identity: admins, teachers, students, parents, staff.
- School operations: announcements, events, analytics.
- Finance and payments: fee tracking and Stripe checkout/webhook integration.

## System Overview

```text
Client (Next.js App Router)
  -> Middleware (auth + RBAC)
  -> Server Actions / API Routes
  -> Prisma ORM
  -> PostgreSQL

Integrations: Stripe, UploadThing, Resend
```

For deeper design details, see [Architecture](./docs/ARCHITECTURE.md).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js Server Actions, Route Handlers |
| Data | PostgreSQL, Prisma |
| Auth | Auth.js (NextAuth v5 beta), JWT sessions |
| Payments | Stripe |
| File Uploads | UploadThing |
| Testing | Vitest, Playwright |
| DevOps | GitHub Actions, Docker, Docker Compose |

## Local Development

### Prerequisites

- Node.js `>=22`
- pnpm `10.x`
- PostgreSQL (local or cloud)

### Quick Start

```bash
git clone https://github.com/yusufdupsc1/ScholaOps.git
cd ScholaOps
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm db:seed # optional
pnpm dev
```

Open `http://localhost:3000`.

### Environment Variables

Source of truth: [.env.example](./.env.example)

Key required variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

Optional integrations:

- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`
- `RESEND_API_KEY`

## Quality Gates

```bash
pnpm run lint
pnpm run type-check
pnpm run test
pnpm run test:e2e
pnpm run build
```

## Deployment

### Vercel (managed)

- CI workflow includes production deploy hooks via `pnpm dlx vercel`.
- Ensure secrets are configured in GitHub + Vercel environments.

### Docker (self-hosted)

```bash
docker compose up -d --build
```

- Uses a multi-stage Dockerfile with Next.js standalone output.
- Includes app, Postgres, Redis, and a migration job service.

Full runbook: [Deployment Guide](./docs/DEPLOYMENT.md).

## API Surface

Representative routes:

- `GET /api/health` (app + DB health)
- `POST /api/auth/[...nextauth]` (Auth.js handlers)
- `GET/POST /api/uploadthing` (file uploads)
- `POST /api/webhooks/stripe` (payment webhooks)

Primary domain logic lives in:

- [`src/server/actions`](./src/server/actions)

## Repository Structure

```text
src/
  app/            # App Router pages + API routes
  components/     # UI and feature components
  lib/            # Shared libs (auth, db, env, utils)
  server/actions/ # Core business actions
prisma/           # Data model and seed scripts
tests/            # Unit, integration, and e2e suites
.github/          # CI/CD workflows
```

## Documentation Index

- [Architecture](./docs/ARCHITECTURE.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Security Policy](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)

## Security

Security practices and disclosure process are documented in [SECURITY.md](./SECURITY.md).

## License

This project is licensed under the [MIT License](./LICENSE).
