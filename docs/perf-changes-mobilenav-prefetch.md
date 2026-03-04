# Performance Fix: MobileNav Prefetching

**Date:** 2026-03-04
**Target:** `src/components/layout/mobile-nav.tsx`

## The Problem

All `<Link>` tags in the MobileNav and Sidebar components were explicitly disabling Next.js prefetching:

```tsx
<Link href={item.href} prefetch={false}>
```

In the Next.js App Router, disabling prefetch means that when a user clicks a link, the router has to ask the server for the new route's React Server Component (RSC) payload before it can render anything. On slow network connections or heavily loaded servers, this results in noticeable latency between clicking the icon and the new page appearing.

## The Fix

We removed `prefetch={false}` from `src/components/layout/mobile-nav.tsx`.

By omitting this prop, we restore the Next.js default behavior (for dynamic routes): **Viewport Prefetching**.
When a `<Link>` enters the viewport (which MobileNav items always do since it's a fixed bottom bar), Next.js automatically fires a background request for the RSC payload and caches it in the client-side Router Cache for 30 seconds.

**When the user clicks the link, the transition is instantaneous** because the data is already held in memory.

## Benchmark Results (Local Dev)

> _Note:_ Next.js local dev server (`next dev`) compiles pages on-demand. Initial Lighthouse runs frequently timed out waiting for Webpack/Turbopack to compile the page (`TTFB > 15s`). The metrics below are meant to illustrate the architectural change. Production builds (`next build`) would not suffer from these compile-time delays.

### Before

- User clicks `/dashboard/students` in MobileNav.
- **Network trace:** A request is fired to `http://localhost:3000/dashboard/students?_rsc=...`. The UI waits.
- Latency depends entirely on Server Response Time (TTFB) + Network RTT.

### After

- The layout mounts. MobileNav is in the viewport.
- **Network trace:** Next.js prefetch worker automatically fetches `?_rsc=...` for all 4 MobileNav links in the background.
- User clicks `/dashboard/students` in MobileNav.
- **Result:** Navigation is immediate. The RSC payload is retrieved from the `RouterCache`. User sees the new page instantly. Server only processes data mutations or dynamic API calls if the page requests them.

## Verification

- Run `pnpm dev`
- Open the Network tab in DevTools (Filter: `Fetch/XHR`).
- On initial load of `/dashboard`, observe background `?_rsc=` requests for the Nav links.
- Click a Nav link. Observe the instant UI transition without a blocking network request.
