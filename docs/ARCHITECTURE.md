# Architecture

This document captures the high-level design and tradeoffs in scholaOps.

## 1) Core Principles

- Multi-tenant by default: every business entity is scoped to an institution.
- Server-centric architecture: business logic in server actions and route handlers.
- Security as baseline: auth, RBAC, validated inputs, and secure headers.
- Operationally aware: health checks, CI gates, standalone Docker runtime.

## 2) Request Flow

```text
Browser
  -> Next.js App Router
  -> Middleware (auth + role checks)
  -> Server Action / API Route
  -> Prisma
  -> PostgreSQL
```

## 3) Multi-Tenancy Model

Top-level boundary is `Institution`.
Most domain records include `institutionId` and are queried in institution scope.

Examples from schema:

- `User -> institutionId`
- `Student -> institutionId`
- `Teacher -> institutionId`
- `Class -> institutionId`
- `Fee -> institutionId`

This creates a clear tenant boundary in application logic and data access.

## 4) Identity and Access Control

- Auth provider: Auth.js (NextAuth v5 beta), JWT session strategy.
- Credentials auth with optional Google OAuth.
- Middleware enforces protected route access and role checks.
- JWT includes role and institution claims for downstream authorization.

## 5) Application Layers

## UI Layer

- Next.js App Router pages and React components under `src/app` + `src/components`.

## Domain Layer

- Server-side actions under `src/server/actions` implement business workflows.
- Validation and guardrails applied before persistence.

## Data Layer

- Prisma client in `src/lib/db.ts`.
- PostgreSQL schema managed via Prisma migrations/schema.

## Integration Layer

- Stripe for payment and webhook workflows.
- UploadThing for file ingestion.
- Resend for email delivery.

## 6) Security Controls

- Security headers configured in `next.config.ts` (CSP, HSTS, frame, content-type, referrer, permissions).
- Environment validation in `src/lib/env.ts`.
- Auth middleware in `middleware.ts`.
- Health endpoint at `/api/health` verifies app + DB readiness.

## 7) Runtime and Deployability

- Next.js configured with `output: "standalone"` for container deployment.
- Dockerfile uses multi-stage build optimized for production runtime.
- CI pipeline validates lint, type safety, tests, and build before deployment.

## 8) Tradeoffs and Next Steps

Current architecture emphasizes clarity and production readiness for a single service.
Natural next steps for scale:

- Introduce distributed rate limiter/cache backend (Redis) for multi-instance consistency.
- Add structured logging and centralized tracing.
- Add contract tests for external integration boundaries.
