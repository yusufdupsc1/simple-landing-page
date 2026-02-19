// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();

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
        version: process.env.npm_package_version ?? "2.0.0",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: "error",
          app: "ok",
        },
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
