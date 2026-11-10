import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes to pass through
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow static files to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg (favicon files)
     */
    '/((?!_next/static|_next/image|favicon|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
  ],
};
