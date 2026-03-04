# Performance CI Regression Checks

This document outlines the performance automation implemented to prevent regressions in ScholasticOS (Dhadash).

## 1. Playwright E2E Performance Tests

We use Playwright to measure core interactive performance on mobile viewports.

### Measured Metrics

- **Hamburger Menu Open**: Targeted to be under **250ms**.
- **Navigation Transitions**: Ensures 3 core navigation flows work without errors or significant latency.

### Run Local

```bash
pnpm exec playwright test tests/e2e/perf-regression.spec.ts
```

## 2. Lighthouse CI Audit

We run automated Lighthouse audits against key pages with strict thresholds.

### Thresholds

| Metric                             | Threshold |
| ---------------------------------- | --------- |
| **Performance Score**              | >= 60     |
| **Total Blocking Time (TBT)**      | <= 700ms  |
| **Largest Contentful Paint (LCP)** | <= 4.5s   |

### Run Local

```bash
# Requires local dev server or build running
LH_THRESHOLD_SCORE=60 pnpm run perf:lighthouse
```

## 3. GitHub Actions Integration

The workflow is located in `.github/workflows/perf.yml`.

### Features:

- Triggered on every Pull Request to `main`.
- Automatically builds the application.
- Runs Playwright tests and Lighthouse audits in parallel.
- Uploads detailed HTML reports for both as GitHub Action artifacts.
- Fails the build if thresholds are not met or tests fail.

### Configuration

Thresholds can be adjusted via environment variables in the workflow file.
