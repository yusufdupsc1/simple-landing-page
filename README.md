# AegisCampus Prime
### Production-Ready Institutional Intelligence for Modern Schools

AegisCampus Prime is a full-stack school management platform built with Next.js + Prisma. It is tuned for deployable operations, secure session handling, and practical administration workflows.

## Core Highlights
- Role-oriented dashboard with protected routes
- Student, employee, class, subject, attendance, fees, reports, and settings modules
- Signed, expiring auth cookies with middleware validation
- Login endpoint rate limiting for brute-force protection
- Health endpoint for runtime checks (`/api/health`)
- Containerized deployment with non-root runtime user

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM (SQLite default; PostgreSQL recommended for scale)
- Zod + React Hook Form

## Local Development
```bash
npm install
cp .env.example .env
npm run db:reset
npm run dev
```

## Deployment Validation
```bash
npm run lint
npm run build
npm run start
npm run test:smoke:auth
```

## Docker Deployment
```bash
docker compose up --build
```

Runtime checks:
- `GET /api/health`
- `GET /login`
- `GET /dashboard` (auth required)

## Required Environment Variables
- `DATABASE_URL`
- `AUTH_SESSION_SECRET`
- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`

Optional auth tuning:
- `AUTH_SESSION_TTL_SECONDS` (default 43200)
- `AUTH_RATE_LIMIT_MAX` (default 10)
- `AUTH_RATE_LIMIT_WINDOW_MS` (default 60000)

## Demo Credentials
- Email: `admin@eskooly.com`
- Password: `admin123`
