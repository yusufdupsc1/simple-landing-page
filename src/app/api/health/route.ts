// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  const requiredEnv = ["DATABASE_URL", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL"];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  const runtimeVersion =
    process.env.VERCEL_GIT_COMMIT_TAG ??
    process.env.npm_package_version ??
    packageJson.version ??
    (process.env.VERCEL_GIT_COMMIT_SHA
      ? `sha-${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
      : "unknown");

  try {
    // Test DB connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        latency: Date.now() - start,
        services: {
          database: "ok",
          app: "ok",
        },
        checks: {
          dbConnectivity: true,
          envComplete: missingEnv.length === 0,
          missingEnv,
          realtimeProvider: env.REALTIME_PROVIDER,
          aiAssistEnabled: env.ENABLE_AI_ASSIST,
        },
        version: runtimeVersion,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: "error",
          app: "ok",
        },
        checks: {
          dbConnectivity: false,
          envComplete: missingEnv.length === 0,
          missingEnv,
        },
        error: "Database connection failed",
      },
      { status: 503 },
    );
  }
}
