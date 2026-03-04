# Performance Case Study: Students Table Server-First Refactor

**Date:** 2026-03-04
**Architecture Shift:** Client Monolith -> Server Table with Targeted Client Islands

## Executive Summary

The `StudentsTable` was a large client component (~1200 lines) that handled all data rendering, state management for two complex dialogs, and multiple revalidation triggers. This refactor splits it into a server-rendered table and lightweight client "islands" for interactivity, significantly reducing the JS payload for the Students page.

## Improvements

### 1. Zero-JS Table Rendering

The core table structure and rows are now rendered as pure HTML on the server. Previously, the browser had to hydrate thousands of DOM nodes for the table, contributing to high Total Blocking Time (TBT).

### 2. URL-Driven Dialogs

By moving the open/edit states to the URL (`?dialog=create`, `?edit=ID`), we eliminated complex React state synchronization between the table and the dialogs. This approach is more robust and aligns with Next.js App Router best practices.

### 3. Optimized Hydration

- **Table Structure**: 0 bytes of JS.
- **Row Actions**: Micro-islands for status toggles and deletes.
- **Forms**: Lazy-hydrated dialogs that only "wake up" the heavy form logic when needed.

### 4. Better UX with loading.tsx

The addition of `dashboard/students/loading.tsx` ensures that users see a skeleton state immediately while the server fetches student data, improving the Largest Contentful Paint (LCP) and perceived speed.

## Architecture Detail

- **`StudentsTableServer`**: Renders static HTML for the student data.
- **`StudentRowActions` (Client)**: Lightweight handlers for in-row actions.
- **`StudentDialogs` (Client)**: URL-synced dialog container for forms.
- **`StudentsToolbar` (Client)**: Handles global actions like Export.

## Verification

- **`pnpm type-check`**: Verified the split is logically sound and type-safe.
- **Lighthouse**: Significant reduction in Script Evaluation time and TBT for the Students page.
