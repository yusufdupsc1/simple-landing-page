# Performance Case Study: Server-First Sidebar Refactor

**Date:** 2026-03-04
**Architecture Shift:** Client Monolith -> Server Component with Client Islands

## Executive Summary

The Sidebar, previously a large client component (`"use client"`), was refactored into a React Server Component (RSC). This shift significantly improves the application's perceived performance and reduces the JavaScript footprint on the client.

## Improvements

### 1. Reduced Hydration Overhead

By rendering the sidebar on the server, we eliminated the need for the browser to hydrate the entire navigation tree. This directly reduces **Total Blocking Time (TBT)** during page load.

### 2. Zero-JS Role Filtering

The complex logic for filtering navigation items based on user roles and government mode now happens purely on the server. The client no longer receives or processes the logic for hidden routes.

### 3. Native Prefetching

By transitioning to standard `<Link>` components wrapped in a lightweight `ActiveLink` client island, we restored Next.js's native viewport prefetching. This makes navigation feel instantaneous as route data is cached before the user even clicks.

### 4. Simplified Logout

Logout transitioned from a client-side function call (`signOut()`) to a standard HTTP POST form. This reduces client-side dependency on the `next-auth/react` library within the sidebar.

## Architecture Detail

- **`SidebarServer` (Server Component)**: Handles data fetching (session, locale, dictionary) and returns static HTML for the layout.
- **`ActiveLink` (Client Island)**: A tiny (~1KB) component that only handles CSS active state management and prefetching.

## Verification

- **`pnpm type-check`**: Verified no broken imports or props.
- **`perf:trace`**: Observable reduction in initial JS execution time for the dashboard shell.
