// src/app/api/auth/[...nextauth]/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export { GET, POST } from "@/lib/auth";
