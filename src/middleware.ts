import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserIdFromAuthTokenEdge } from '@/lib/session-edge';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const userId = await getUserIdFromAuthTokenEdge(authToken);
  const isAuthenticated = Boolean(userId);

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');
  const isRoot = request.nextUrl.pathname === '/';
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  if (isApiAuth || isLoginPage) {
    return NextResponse.next();
  }

  if (!isAuthenticated && (isRoot || isDashboard)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
