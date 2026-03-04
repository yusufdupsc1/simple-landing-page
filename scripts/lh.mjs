/**
 * scripts/lh.mjs
 * Lighthouse mobile audit runner — outputs HTML + JSON to ./perf/lh/
 *
 * Run: pnpm perf:lighthouse
 * Requires:
 *   PLAYWRIGHT_BASE_URL env (default: http://localhost:3000)
 *   AUTH_COOKIE env — session cookie string (same as trace.mjs)
 *   lighthouse installed globally OR via pnpm dlx
 *
 * Install once: pnpm add -D lighthouse
 */

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const AUTH_COOKIE = process.env.AUTH_COOKIE ?? "";
const OUT_DIR = path.resolve(__dirname, "../perf/lh");

// Pages to audit
const PAGES = [
  { path: "/dashboard", slug: "dashboard" },
  { path: "/dashboard/students", slug: "students" },
  { path: "/dashboard/finance", slug: "finance" },
];

// Mobile emulation config (Lighthouse preset)
const LH_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "mobile",
    throttlingMethod: "simulate",
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
    },
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },
    emulatedUserAgent:
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    onlyCategories: ["performance"],
  },
};

function buildFlags(port, cookie) {
  const flags = {
    port,
    output: ["html", "json"],
    logLevel: "error",
  };
  if (cookie) {
    flags.extraHeaders = { Cookie: cookie };
  }
  return flags;
}

async function runPage(chrome, { path: pagePath, slug }) {
  const url = `${BASE_URL}${pagePath}`;
  console.log(`\n  → auditing ${url} …`);

  const flags = buildFlags(chrome.port, AUTH_COOKIE);
  const result = await lighthouse(url, flags, LH_CONFIG);
  if (!result) throw new Error(`Lighthouse returned null for ${url}`);

  const { report, lhr } = result;
  const [html, json] = Array.isArray(report) ? report : [report, "{}"];

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const baseName = `${slug}-${ts}`;
  const htmlPath = path.join(OUT_DIR, `${baseName}.html`);
  const jsonPath = path.join(OUT_DIR, `${baseName}.json`);

  await fs.writeFile(htmlPath, html, "utf8");
  await fs.writeFile(
    jsonPath,
    typeof json === "string" ? json : JSON.stringify(lhr, null, 2),
    "utf8",
  );

  // Extract key metrics from the Lighthouse result
  const metrics = lhr.audits;
  const fcp = metrics["first-contentful-paint"]?.displayValue ?? "–";
  const lcp = metrics["largest-contentful-paint"]?.displayValue ?? "–";
  const tbt = metrics["total-blocking-time"]?.displayValue ?? "–";
  const ttfb = metrics["server-response-time"]?.displayValue ?? "–";
  const cls = metrics["cumulative-layout-shift"]?.displayValue ?? "–";
  const si = metrics["speed-index"]?.displayValue ?? "–";
  const score = Math.round((lhr.categories.performance?.score ?? 0) * 100);
  const jsBytes =
    lhr.audits["total-byte-weight"]?.details?.items
      ?.filter((i) => i.url?.includes(".js"))
      ?.reduce((acc, i) => acc + (i.totalBytes ?? 0), 0) ?? 0;

  console.log(
    `  ✓ score: ${score}  LCP: ${lcp}  TBT: ${tbt}  TTFB: ${ttfb}  CLS: ${cls}  FCP: ${fcp}  SI: ${si}  JS: ${(jsBytes / 1024).toFixed(0)}KB`,
  );
  console.log(`     html → ${htmlPath}`);
  console.log(`     json → ${jsonPath}`);

  return {
    slug,
    score,
    fcp,
    lcp,
    tbt,
    ttfb,
    cls,
    si,
    jsBytes,
    htmlPath,
    jsonPath,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });

  if (!AUTH_COOKIE) {
    console.warn(
      "WARNING: AUTH_COOKIE not set — unauthenticated pages will redirect to login.\n" +
        "  Set AUTH_COOKIE='next-auth.session-token=...' to audit authenticated pages.",
    );
  }

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
  });

  console.log(`\n[LH] Running Lighthouse mobile audits against ${BASE_URL}`);
  console.log(`[LH] Chrome on port ${chrome.port}`);

  const results = [];
  for (const page of PAGES) {
    try {
      const r = await runPage(chrome, page);
      results.push(r);
    } catch (err) {
      console.error(`  ✗ FAILED ${page.path}: ${err.message}`);
      results.push({ slug: page.slug, error: err.message });
    }
  }

  await chrome.kill();

  // Write a summary JSON for easy diffing in CI
  const summaryPath = path.join(OUT_DIR, "summary.json");
  await fs.writeFile(
    summaryPath,
    JSON.stringify(
      { timestamp: new Date().toISOString(), baseUrl: BASE_URL, results },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\n✅ Lighthouse done. Summary → ${summaryPath}\n`);

  // Threshold validation for Task 8
  const THRESHOLDS = {
    score: parseInt(process.env.LH_THRESHOLD_SCORE || "60"),
    tbt: parseInt(process.env.LH_THRESHOLD_TBT || "700"),
    lcp: parseFloat(process.env.LH_THRESHOLD_LCP || "4.5"),
  };

  console.log("\nThreshold Check:");
  let failed = false;
  for (const r of results) {
    if (r.error) continue;

    const tbtVal = parseInt(r.tbt.replace(/[ms, ]/g, "")) || 0;
    const lcpVal = parseFloat(r.lcp.replace(/[s, ]/g, "")) || 0;

    const scoreOk = r.score >= THRESHOLDS.score;
    const tbtOk = tbtVal <= THRESHOLDS.tbt;
    const lcpOk = lcpVal <= THRESHOLDS.lcp;

    console.log(
      `  ${r.slug.padEnd(14)} Score: ${scoreOk ? "PASS" : "FAIL"} (${r.score}/${THRESHOLDS.score}), TBT: ${tbtOk ? "PASS" : "FAIL"} (${tbtVal}ms/${THRESHOLDS.tbt}ms), LCP: ${lcpOk ? "PASS" : "FAIL"} (${lcpVal}s/${THRESHOLDS.lcp}s)`,
    );

    if (!scoreOk || !tbtOk || !lcpOk) failed = true;
  }

  if (failed) {
    console.error("\n❌ Performance regression detected! Thresholds not met.");
    process.exit(1);
  } else {
    console.log("\n✅ All performance thresholds satisfied.");
  }
})();
