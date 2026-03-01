// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import {
  getDefaultDashboardPath,
  roleAllowedDashboardPrefixes,
  isPrivilegedRole,
} from "@/lib/role-routing";
import { normalizeLocale, type SupportedLocale } from "@/lib/i18n/getDict";

const LOCALE_COOKIE = "locale";

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/request-access",
  "/auth/pending-approval",
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
  "/dashboard/control",
];

const AUTH_SECRETS = [
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
].filter((secret): secret is string => Boolean(secret));
const AUTH_SECRET = AUTH_SECRETS.length > 1 ? AUTH_SECRETS : AUTH_SECRETS[0];
const AUTH_DEBUG = process.env.AUTH_DEBUG === "1";
const SESSION_COOKIE_CANDIDATES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

function resolveLocale(req: NextRequest) {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const acceptLanguage = req.headers.get("accept-language")?.toLowerCase() ?? "";
  if (acceptLanguage.includes("bn")) return "bn";
  // Bangladesh-first default until user explicitly switches to English.
  return "bn";
}

function withLocaleCookie(response: NextResponse, locale: SupportedLocale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const locale = resolveLocale(req);

  // 1. Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/uploadthing") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return withLocaleCookie(NextResponse.next(), locale);
  }

  // 2. Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return withLocaleCookie(response, locale);
  }

  // 3. Get session token (Edge-compatible)
  // getToken automatically handles cookie decryption using AUTH_SECRET
  const isSecureCookie = req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const presentCookies = SESSION_COOKIE_CANDIDATES.filter((cookieName) =>
    Boolean(req.cookies.get(cookieName)?.value)
  );

  let token = null;
  for (const cookieName of SESSION_COOKIE_CANDIDATES) {
    if (!req.cookies.get(cookieName)?.value) continue;
    token = await getToken({
      req,
      secret: AUTH_SECRET,
      cookieName,
      secureCookie: cookieName.startsWith("__Secure-"),
    });
    if (token) break;
  }

  // Defensive fallback when proxy headers/cookie prefixes are inconsistent.
  if (!token) {
    token = await getToken({
      req,
      secret: AUTH_SECRET,
      secureCookie: isSecureCookie,
    }) ?? await getToken({
      req,
      secret: AUTH_SECRET,
      secureCookie: !isSecureCookie,
    });
  }

  if (!token) {
    if (AUTH_DEBUG) {
      console.log("[auth-debug] middleware skip (no token)", {
        pathname,
        requestId,
        hasAuthSecret: AUTH_SECRETS.length > 0,
        isSecureCookie,
        presentCookies,
        tokenResolved: false,
      });
    }
    if (pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
      return withLocaleCookie(NextResponse.redirect(loginUrl), locale);
    }
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return withLocaleCookie(response, locale);
  }

  if (AUTH_DEBUG) {
    console.log("[auth-debug] middleware pass", {
      pathname,
      requestId,
      hasAuthSecret: AUTH_SECRETS.length > 0,
      isSecureCookie,
      presentCookies,
      tokenResolved: true,
      userId: token.sub,
      role: token.role,
    });
  }

  // 4. RBAC Check
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const userRole = token.role as string;
  const isAdmin = isPrivilegedRole(userRole);

  if (isAdminRoute && !isAdmin) {
    return withLocaleCookie(
      NextResponse.redirect(new URL("/dashboard", req.url)),
      locale,
    );
  }

  if (pathname.startsWith("/dashboard")) {
    const allowedPrefixes = roleAllowedDashboardPrefixes(userRole);
    const isAllowed = allowedPrefixes.some((prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (!isAllowed) {
      return withLocaleCookie(
        NextResponse.redirect(new URL(getDefaultDashboardPath(userRole), req.url)),
        locale,
      );
    }
  }

  // 5. Success — Add context headers for Server Components
  const response = NextResponse.next();

  response.headers.set("x-request-id", requestId);
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

  return withLocaleCookie(response, locale);
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
