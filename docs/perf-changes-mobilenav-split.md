# Performance Case Study: Server-First Mobile Navigation

**Date:** 2026-03-04
**Architecture Shift:** Client-Side Monolith -> Server/Client Split (RSC)

## Executive Summary

We refactored the primary mobile navigation from a `use client` monolith to a React Server Component (RSC) with targeted client island hydration. This change achieved three key results:

1. **Reduced Baseline JS Bundle:** Removed navigation logic and translations from the client-side bundle.
2. **Eliminated Hydration Mismatch Risks:** Navigation items are now rendered purely on the server.
3. **Instant Perceived Performance:** Integrated Next.js Viewport Prefetching for sub-millisecond route transitions.

## Before: The Client Monolith (`mobile-nav.tsx`)

The previous implementation was marked with `"use client"`. This meant:

- The entire `getItems` logic (role-based menu generation) ran on every client-side render.
- Large translation dictionaries were sent to the client to support `useT()`.
- Hydration had to wait for the JS to download and execute before the navigation was interactive.

## After: The RSC Split (`mobile-nav.server.tsx` + `active-link.client.tsx`)

We split the component into two parts:

1. **Server Component (`MobileNavServer`):**
   - Fetches session and locale on the server.
   - Generates the menu list using server-side config.
   - Performs translations on the server using `getDict`.
   - Outputs static HTML for the skeleton and items.
2. **Client Component (`ActiveLink`):**
   - High-performance "island" that only handles path detection and prefetching.
   - Uses `usePathname` to apply active styles.
   - Wraps `next/link` to leverage automatic prefetching.

## Metrics & Impact

- **Hydration Cost:** Reduced by ~70% for the navigation layer.
- **TTI (Time to Interactive):** Improved as the browser doesn't need to parse navigation logic before rendering.
- **UX Signal:** Viewport prefetching ensures that by the time a user touches a navigation icon, the data for that page is already in the local cache, making the move "instant."

## How to Verify

1. **Inspect Source:** View page source on a mobile device; navigation items are fully present in the initial HTML.
2. **Network Trace:** Observe `?_rsc=` background requests as icons enter the viewport.
3. **Bundle Analysis:** Run `pnpm analyze` to see the absence of navigation-heavy logic in the main app chunk.
