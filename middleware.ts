// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/error",
  "/api/auth",
  "/api/health",
  "/terms",
  "/privacy",
];

const ADMIN_ROUTES = [
  "/dashboard/settings",
  "/dashboard/finance",
  "/dashboard/users",
];

const AUTH_SECRET = process.env.AUTH_SECRET;

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/uploadthing") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // 2. Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  // 3. Get session token (Edge-compatible)
  // getToken automatically handles cookie decryption using AUTH_SECRET
  const token = await getToken({
    req,
    secret: AUTH_SECRET,
    salt: process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  });

  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. RBAC Check
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const userRole = token.role as string;
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 5. Success — Add context headers for Server Components
  const response = NextResponse.next();

  if (token.sub) response.headers.set("x-user-id", token.sub);
  if (userRole) response.headers.set("x-user-role", userRole);
  if (token.institutionId) {
    response.headers.set("x-institution-id", token.institutionId as string);
  }
  if (token.institutionSlug) {
    response.headers.set("x-institution-slug", token.institutionSlug as string);
  }
  if (token.institutionName) {
    response.headers.set("x-institution-name", token.institutionName as string);
  }

  return response;
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

