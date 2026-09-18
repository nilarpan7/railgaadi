import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './rate-limiter';
import type { RateLimitConfig, RateLimitResult } from './rate-limiter';

/**
 * Shared HTTP plumbing for API routes: request metadata (request id, client
 * ip), a standard error envelope, and cache-control header construction.
 *
 * The success envelope is intentionally the *payload itself* — existing
 * clients parse `response.json()` directly and treat any `!response.ok` as a
 * failure, so we keep success responses byte-compatible and only standardize
 * the error body.
 */

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface CacheControlSpec {
  /** Browser-side max-age in seconds. */
  maxAge: number;
  /** Shared/CDN max-age in seconds (omit to disable CDN caching). */
  sMaxAge?: number;
  /** Serve stale while revalidating (seconds). */
  staleWhileRevalidate?: number;
}

function cacheControlHeader(spec: CacheControlSpec): string {
  const parts = [`max-age=${spec.maxAge}`];
  if (spec.sMaxAge !== undefined) parts.push(`s-maxage=${spec.sMaxAge}`);
  if (spec.staleWhileRevalidate !== undefined) parts.push(`stale-while-revalidate=${spec.staleWhileRevalidate}`);
  return parts.join(', ');
}

/** Request id for correlation — honours one set by middleware/proxy. */
export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') || crypto.randomUUID();
}

/** Best-effort client IP from standard proxy headers. */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Rate limit a request keyed on the authenticated user handle when present,
 * falling back to the client IP for anonymous traffic. Uses a dynamic import
 * of the auth config so an unset AUTH_SECRET degrades to IP limiting instead
 * of failing every route that imports this module.
 *
 * `scope` namespaces the budget so different routes (search, live, auth, ...)
 * don't consume each other's quota.
 */
export async function rateLimitRequest(
  request: NextRequest,
  config: RateLimitConfig,
  scope = 'api'
): Promise<RateLimitResult> {
  let userKey: string | undefined;
  try {
    const { auth } = await import('@/auth');
    const session = await auth();
    userKey = session?.user?.id;
  } catch {
    userKey = undefined;
  }
  const identity = userKey ? `user:${userKey}` : `ip:${getClientIp(request)}`;
  return rateLimit(`${scope}:${identity}`, config);
}

export interface OkOptions {
  cacheControl?: CacheControlSpec;
  /** Sets `x-railgaadi-fallback` when the payload is degraded (demo/synthetic). */
  fallback?: string;
  requestId?: string;
}

export function ok<T>(data: T, options: OkOptions = {}): NextResponse {
  const headers = new Headers();
  if (options.requestId) headers.set('x-request-id', options.requestId);
  if (options.cacheControl) {
    headers.set('Cache-Control', cacheControlHeader(options.cacheControl));
  } else {
    headers.set('Cache-Control', 'no-store');
  }
  if (options.fallback) headers.set('x-railgaadi-fallback', options.fallback);
  return NextResponse.json(data, { headers });
}

export interface ErrorOptions {
  /** True when a retry (e.g. by the client) may succeed later. */
  retryable?: boolean;
  /** Seconds for the client to wait — required for 429. */
  retryAfter?: number;
  requestId?: string;
}

export function error(
  status: number,
  code: string,
  message: string,
  options: ErrorOptions = {}
): NextResponse {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store');
  if (options.requestId) headers.set('x-request-id', options.requestId);
  if (options.retryAfter !== undefined) headers.set('Retry-After', String(options.retryAfter));

  const body: ErrorEnvelope = {
    error: {
      code,
      message,
      retryable: options.retryable ?? (status >= 500 || status === 429),
    },
  };

  return NextResponse.json(body, { status, headers });
}
