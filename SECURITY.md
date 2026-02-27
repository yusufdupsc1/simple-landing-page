# Security Policy

## Supported Versions

Security updates are applied to the `main` branch.

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Use one of these channels:

- GitHub Security Advisories (preferred)
- Directly contact the maintainer via GitHub profile messaging

Include:

- Affected component/file
- Reproduction steps
- Impact assessment
- Suggested remediation (if available)

## Security Baseline in This Repository

- Auth.js-based authentication with JWT session strategy
- Middleware-based route protection and RBAC enforcement
- Secure HTTP headers via Next.js config (CSP, HSTS, etc.)
- Environment variable validation with Zod
- Prisma ORM to reduce SQL injection risk through typed query APIs

## Secrets Handling

- No production credentials should be committed to Git.
- `.env.example` contains placeholders only.
- Runtime secrets must be injected via deployment platform secret stores.
