import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ ok: true, route: "/api/payments/sslcommerz/init" });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/payments/sslcommerz/init" });
}