# Performance Case Study: Server-First TopBar Refactor

**Date:** 2026-03-04
**Architecture Shift:** Client Monolith -> Server Component with Client Island (LanguageToggle)

## Executive Summary

The TopBar was refactored from a client component (`"use client"`) to a React Server Component (RSC). This further reduces the global hydration overhead of the dashboard shell, as the primary layout's top-level components are now all server-first.

## Improvements

### 1. Reduced Hydration Cost

The TopBar is part of the persistent layout. By moving it to the server, we prevent the browser from having to re-render and hydrate the static parts of the header (labels, institution names) on every load.

### 2. Server-Side I18n

Label computation (e.g., "Head Teacher", "Assistant Teacher") now happens on the server. This removes the need for `useT()` and `useGovtPrimaryT()` hooks in the TopBar, further slimming down the client-side JavaScript sent to the browser.

### 3. Progressive Hydration

The only interactive part of the TopBar—the `LanguageToggle`—remains a client component, but it is now hydrated as an "island" nested within the server-rendered header.

## Architecture Detail

- **`TopBarServer` (Server Component)**: Performs session and dictionary lookups to render the core header HTML.
- **`LanguageToggle` (Client Component)**: Handles user-triggered locale changes.

## Verification

- **`pnpm type-check`**: Verified no broken imports or props.
- **Lighthouse/Trace**: Continued reduction in Total Blocking Time (TBT) due to decreased hydration work on the main thread.
