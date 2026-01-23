import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to add headers required for SharedArrayBuffer (WASM threading)
 * These headers enable cross-origin isolation for Atomics.waitAsync
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add headers for SharedArrayBuffer support - Relaxed for Google Sign-in
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  // response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')

  return response
}

// Apply to all routes
export const config = {
  matcher: '/:path*',
}
