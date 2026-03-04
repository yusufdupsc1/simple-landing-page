/**
 * scripts/trace.mjs
 * Playwright trace recording for dashboard navigation baseline.
 *
 * Records: open /dashboard, wait for topbar, click 3 sidebar nav links,
 * click 3 MobileNav items. Saves trace to ./perf/trace.zip
 *
 * Run: pnpm perf:trace
 * Requires: PLAYWRIGHT_BASE_URL env (default: http://localhost:3000)
 *           AUTH_COOKIE env — cookie string copied from browser after login
 *           e.g. AUTH_COOKIE="next-auth.session-token=xxxx"
 */

import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const AUTH_COOKIE = process.env.AUTH_COOKIE ?? "";
const OUT_DIR = path.resolve(__dirname, "../perf");

// ── Selectors ────────────────────────────────────────────────────────────────
//
// Hamburger: Does NOT exist yet in the codebase. TopBar has no hamburger
// button. MobileNav is a fixed-bottom <nav aria-label="Mobile primary">.
// Sidebar is desktop-only (hidden on mobile, visible on lg+).
// Trace is recorded at 390×844 (mobile viewport) so sidebar is hidden.
//
// When a hamburger is added, update HAMBURGER_SEL below.
const HAMBURGER_SEL = null; // ⚠️  Not implemented – see docs/perf-baseline.md

// Sidebar nav links (desktop, visible at 1440px wide)
const SIDEBAR_NAV_ITEMS = [
  'nav[aria-label="Primary"] a[href="/dashboard/students"]',
  'nav[aria-label="Primary"] a[href="/dashboard/teachers"]',
  'nav[aria-label="Primary"] a[href="/dashboard/finance"]',
];

// MobileNav (fixed bottom, visible at mobile viewport)
const MOBILE_NAV_ITEMS = [
  'nav[aria-label="Mobile primary"] a[href="/dashboard"]',
  'nav[aria-label="Mobile primary"] a[href="/dashboard/students"]',
  'nav[aria-label="Mobile primary"] a[href="/dashboard/teachers"]',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseCookies(cookieStr) {
  return cookieStr.split(";").flatMap((pair) => {
    const [name, ...rest] = pair.trim().split("=");
    const value = rest.join("=");
    if (!name || !value) return [];
    return [
      {
        name: name.trim(),
        value: value.trim(),
        domain: "localhost",
        path: "/",
        secure: true,
      },
    ];
  });
}

async function clickIfExists(page, sel, label) {
  try {
    await page.waitForSelector(sel, { timeout: 5000 });
    await page.click(sel);
    console.log(`  ✓ clicked: ${label}`);
    await page.waitForTimeout(600);
  } catch {
    console.warn(`  ⚠  not found: ${label} (${sel})`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  if (!AUTH_COOKIE) {
    console.error(
      "ERROR: AUTH_COOKIE is not set.\n" +
      "  Login in your browser, copy the cookie header, then:\n" +
      "  AUTH_COOKIE='next-auth.session-token=...' pnpm perf:trace",
    );
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });

  // ── PASS 1: Desktop (sidebar visible) ──────────────────────────────────────
  console.log("\n── Desktop trace (1440×900) ──────────────────────────────");
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  if (AUTH_COOKIE) {
    await desktopCtx.addCookies(parseCookies(AUTH_COOKIE));
  }
  await desktopCtx.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });

  const desktopPage = await desktopCtx.newPage();
  console.log("  → navigating to /dashboard …");
  await desktopPage.goto(`${BASE_URL}/dashboard`, {
    waitUntil: "load",
    timeout: 90_000,
  });

  // Wait for TopBar to confirm page is hydrated
  await desktopPage.waitForSelector("header", { timeout: 10_000 });
  console.log("  ✓ topbar visible");

  // Hamburger (not implemented — document and skip)
  if (HAMBURGER_SEL) {
    await clickIfExists(desktopPage, HAMBURGER_SEL, "hamburger");
  } else {
    console.warn(
      "  ⚠  hamburger: NOT IMPLEMENTED — skipped (see perf-baseline.md)",
    );
  }

  // Sidebar nav interactions
  for (const sel of SIDEBAR_NAV_ITEMS) {
    const label = sel
      .split('href="')[1]
      ?.replace('"]}', '"]')
      .replace('"]', "");
    await clickIfExists(desktopPage, sel, `sidebar → ${label}`);
  }

  const desktopTracePath = path.join(OUT_DIR, "trace-desktop.zip");
  await desktopCtx.tracing.stop({ path: desktopTracePath });
  await desktopCtx.close();
  console.log(`  → saved: ${desktopTracePath}`);

  // ── PASS 2: Mobile (MobileNav visible) ─────────────────────────────────────
  console.log("\n── Mobile trace (390×844) ────────────────────────────────");
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  if (AUTH_COOKIE) {
    await mobileCtx.addCookies(parseCookies(AUTH_COOKIE));
  }
  await mobileCtx.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });

  const mobilePage = await mobileCtx.newPage();
  console.log("  → navigating to /dashboard …");
  await mobilePage.goto(`${BASE_URL}/dashboard`, {
    waitUntil: "load",
    timeout: 90_000,
  });

  await mobilePage.waitForSelector("header", { timeout: 10_000 });
  console.log("  ✓ topbar visible");

  // Hamburger (not implemented)
  if (HAMBURGER_SEL) {
    await clickIfExists(mobilePage, HAMBURGER_SEL, "hamburger");
  } else {
    console.warn("  ⚠  hamburger: NOT IMPLEMENTED — skipped");
  }

  // MobileNav interactions
  for (const sel of MOBILE_NAV_ITEMS) {
    const label = sel
      .split('href="')[1]
      ?.replace('"]}', '"]')
      .replace('"]', "");
    await clickIfExists(mobilePage, sel, `MobileNav → ${label}`);
  }

  const mobileTracePath = path.join(OUT_DIR, "trace-mobile.zip");
  await mobileCtx.tracing.stop({ path: mobileTracePath });
  await mobileCtx.close();
  console.log(`  → saved: ${mobileTracePath}`);

  await browser.close();
  console.log(
    "\n✅ Traces saved:\n" +
    `   ${desktopTracePath}\n` +
    `   ${mobileTracePath}\n` +
    "   View with: npx playwright show-trace perf/trace-desktop.zip",
  );
})();
