# Contributing

Thanks for your interest in improving scholaOps.

## 1) Setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm dev
```

## 2) Branch Strategy

- Base branch: `main`
- Create focused feature branches from `main`
- Keep pull requests small and reviewable

Example branch names:

- `feat/attendance-export`
- `fix/stripe-webhook-validation`
- `chore/ci-cache-tuning`

## 3) Commit Quality

Use clear commit messages describing intent and scope.

Recommended format:

- `feat: add grade trend chart`
- `fix: guard against null teacher profile`
- `chore: tighten Docker runtime image`

## 4) Definition of Done

Before opening a PR, run:

```bash
pnpm run lint
pnpm run type-check
pnpm run test
pnpm run build
```

If your change touches e2e flows, also run:

```bash
pnpm run test:e2e
```

## 5) PR Expectations

Include in PR description:

- Problem statement
- Approach and tradeoffs
- Testing evidence
- Migration/env changes (if any)

## 6) Security

If a change affects auth, permissions, or data boundaries, call it out explicitly in the PR and request focused review.
