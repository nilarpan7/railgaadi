import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Nonce-based Content-Security-Policy.
 *
 * `next/script` inline blocks (theme bootstrap) and Next's own bootstrap
 * scripts need a per-request nonce; without it a strict CSP would break
 * hydration. A random nonce per request makes script-src enforceable while
 * still allowing the app's inline bootstrap script.
 */
const DIRECTIVES = [
  "default-src 'self'",
  // Next.js + MapLibre worker (blob:) + WASM support for the map worker.
  // 'strict-dynamic' lets nonce'd scripts load subsequent scripts (Next
  // bundles, MapLibre worker), which is safer than blanket host sources.
  "script-src 'self' 'wasm-unsafe-eval' 'nonce-{NONCE}' 'strict-dynamic'{DEV_EVAL}",
  // Tailwind injects a <style>; MapLibre popups use inline style attributes
  "style-src 'self' 'unsafe-inline'",
  // Raster/vector basemaps + avatars + noise-overlay data: SVG
  "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://api.maptiler.com https://basemaps.cartocdn.com https://tile.openstreetmap.org https://a.tiles.openrailwaymap.org https://b.tiles.openrailwaymap.org https://c.tiles.openrailwaymap.org",
  // Map tile/style fetches made directly by the browser via MapLibre
  "connect-src 'self' https://api.maptiler.com https://basemaps.cartocdn.com https://tile.openstreetmap.org https://a.tiles.openrailwaymap.org https://b.tiles.openrailwaymap.org https://c.tiles.openrailwaymap.org",
  // MapLibre GL creates a Web Worker from a blob:
  "worker-src 'self' blob:",
  "child-src blob:",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestId = crypto.randomUUID();
  // In development React uses eval() to reconstruct server error stacks.
  const isDev = process.env.NODE_ENV === 'development';

  const csp = DIRECTIVES.replace('{NONCE}', nonce).replace(
    '{DEV_EVAL}',
    isDev ? " 'unsafe-eval'" : ''
  );

  // Pass both the nonce and the full CSP to the request: Next.js reads the
  // CSP header to extract the nonce and applies it to every inline script it
  // renders (bootstrap + <Script> components). Without this, inline scripts
  // would be blocked by the strict policy.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', csp);
  // Request id for page-level correlation; API routes generate their own in
  // `src/lib/http.ts` to keep the middleware off the API path.
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  // Run for HTML page navigations only — skip API routes, static assets and
  // image optimization so their responses stay lean.
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
};
