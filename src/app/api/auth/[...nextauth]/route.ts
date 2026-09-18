import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/auth';
import { rateLimitByIp } from '@/lib/rate-limiter';
import { getClientIp, error } from '@/lib/http';
import { logger } from '@/lib/logger';

type NextAuthHandler = (request: NextRequest) => Promise<NextResponse>;

/**
 * NextAuth v5 does not throttle the credentials callback on its own, and the
 * demo provider accepts any credentials — so this endpoint is the one brute
 * force can hit. OAuth callbacks and session reads are cheap and left alone;
 * only the credentials sign-in path is throttled per IP.
 */
function withCredentialsRateLimit(handler: NextAuthHandler): NextAuthHandler {
  return async (request: NextRequest) => {
    if (request.nextUrl.pathname.endsWith('/callback/credentials')) {
      const limited = rateLimitByIp(getClientIp(request), {
        limit: 10,
        windowMs: 60_000,
      }, 'auth');
      if (!limited.allowed) {
        logger.warn('credentials callback rate limited', { ip: getClientIp(request) });
        return error(429, 'RATE_LIMITED', 'Too many sign-in attempts. Try again shortly.', {
          retryAfter: limited.retryAfterSec,
        });
      }
    }
    return handler(request);
  };
}

export const GET = withCredentialsRateLimit(handlers.GET as NextAuthHandler);
export const POST = withCredentialsRateLimit(handlers.POST as NextAuthHandler);
