// src/app/api/csrf/route.ts
// CSRF token endpoint

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  let csrfToken = cookieStore.get("csrf-token")?.value;

  // Generate new token if not exists
  if (!csrfToken) {
    const crypto = await import("crypto");
    csrfToken = crypto.randomBytes(32).toString("hex");
  }

  const response = NextResponse.json({ csrfToken });

  // Set CSRF cookie (HttpOnly for security)
  response.cookies.set("csrf-token", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}
