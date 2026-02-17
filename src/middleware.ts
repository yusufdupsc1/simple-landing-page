import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Mock authentication check
    // In a real app, you would check for a session token here
    const isAuthenticated = true; // For demo purposes, we assume always authenticated

    // Protect Dashboard and API routes (except auth routes if they existed)
    if (!isAuthenticated) {
        if (request.nextUrl.pathname.startsWith('/dashboard') ||
            request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/:path*',
    ],
}
