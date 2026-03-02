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

function parseLocalePrefix(pathname: string): {
  locale: SupportedLocale | null;
  pathname: string;
} {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return { locale: null, pathname: "/" };
  }

  const [first, ...rest] = parts;
  if (first === "bn" || first === "en") {
    return {
      locale: first,
      pathname: rest.length > 0 ? `/${rest.join("/")}` : "/",
    };
  }

  return { locale: null, pathname };
}

function withLocalePrefix(
  pathname: string,
  locale: SupportedLocale,
  usePrefix: boolean,
): string {
  if (!usePrefix) return pathname;
  if (pathname === "/") return `/${locale}`;
  return `/${locale}${pathname}`;
}

function resolveLocale(req: NextRequest) {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const acceptLanguage = req.headers.get("accept-language")?.toLowerCase() ?? "";
  if (acceptLanguage.includes("bn")) return "bn";
  if (acceptLanguage.includes("en")) return "en";
  // Bangladesh-first default.
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
  const parsedPath = parseLocalePrefix(req.nextUrl.pathname);
  const pathname = parsedPath.pathname;
  const hasLocalePrefix = parsedPath.locale !== null;
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const locale = parsedPath.locale ?? resolveLocale(req);
  const isAssetPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");
  const isApiPath = pathname.startsWith("/api");

  // Redirect non-localized page URLs to locale-prefixed versions.
  if (!hasLocalePrefix && !isAssetPath && !isApiPath) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = withLocalePrefix(pathname, locale, true);
    return withLocaleCookie(NextResponse.redirect(redirectUrl), locale);
  }

  const forward = () => {
    const response = hasLocalePrefix && pathname !== "/"
      ? (() => {
          const rewriteUrl = req.nextUrl.clone();
          rewriteUrl.pathname = pathname;
          return NextResponse.rewrite(rewriteUrl);
        })()
      : NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return withLocaleCookie(response, locale);
  };

  // 1. Allow static files and Next.js internals
  if (
    isAssetPath ||
    pathname.startsWith("/api/uploadthing")
  ) {
    return forward();
  }

  // 2. Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return forward();
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
      const loginUrl = new URL(
        withLocalePrefix("/auth/login", locale, hasLocalePrefix),
        req.url,
      );
      loginUrl.searchParams.set(
        "callbackUrl",
        encodeURIComponent(withLocalePrefix(pathname, locale, hasLocalePrefix)),
      );
      return withLocaleCookie(NextResponse.redirect(loginUrl), locale);
    }
    return forward();
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
      NextResponse.redirect(
        new URL(withLocalePrefix("/dashboard", locale, hasLocalePrefix), req.url),
      ),
      locale,
    );
  }

  if (pathname.startsWith("/dashboard")) {
    const allowedPrefixes = roleAllowedDashboardPrefixes(userRole);
    const isAllowed = allowedPrefixes.some((prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (!isAllowed) {
      const fallbackPath = withLocalePrefix(
        getDefaultDashboardPath(userRole),
        locale,
        hasLocalePrefix,
      );
      return withLocaleCookie(
        NextResponse.redirect(new URL(fallbackPath, req.url)),
        locale,
      );
    }
  }

  // 5. Success — Add context headers for Server Components
  const response = hasLocalePrefix && pathname !== "/"
    ? (() => {
        const rewriteUrl = req.nextUrl.clone();
        rewriteUrl.pathname = pathname;
        return NextResponse.rewrite(rewriteUrl);
      })()
    : NextResponse.next();

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
