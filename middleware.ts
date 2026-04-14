import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    // Apply to everything except static assets and image optimization
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
