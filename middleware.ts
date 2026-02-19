// middleware.ts
// Next.js 16 Middleware — Auth guard + tenant routing

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/auth/login", "/auth/error", "/api/auth"];
const ADMIN_ROUTES = ["/dashboard/settings", "/dashboard/finance"];

export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl, auth: session } = req as any;
  const pathname = nextUrl.pathname;

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  if (isPublic) return NextResponse.next();

  // Redirect unauthenticated users
  if (!session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const userRole = session.user?.role;
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Inject institution context into headers for RSC
  const response = NextResponse.next();
  response.headers.set(
    "x-institution-id",
    session.user?.institutionId ?? ""
  );
  response.headers.set(
    "x-user-role",
    userRole ?? ""
  );

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
