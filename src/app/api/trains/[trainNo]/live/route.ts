import { NextRequest } from 'next/server';
import { normalizeLiveStatus } from '@/services/api-normalizer';
import { railradarGet, resolveApiKey } from '@/services/railradar';
import { isRailRadarLive, mapRailRadarLive } from '@/services/railradar-mapper';
import { cache } from '@/lib/cache';
import { ok, error, getRequestId, rateLimitRequest } from '@/lib/http';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/constants';
import type { LiveStatus } from '@/types/train';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trainNo: string }> }
) {
  const { trainNo } = await params;
  const requestId = getRequestId(request);
  const log = logger.child({ route: 'trains/live', requestId, trainNo });

  if (!/^[a-zA-Z0-9_-]{1,16}$/.test(trainNo)) {
    return error(400, 'INVALID_TRAIN_NO', 'Invalid train number', { requestId });
  }

  const limited = await rateLimitRequest(request, {
    limit: 90,
    windowMs: 60_000,
  }, 'live');
  if (!limited.allowed) {
    log.warn('rate limited');
    return error(429, 'RATE_LIMITED', 'Too many requests — slow down', {
      retryAfter: limited.retryAfterSec,
      requestId,
    });
  }

  const cacheKey = `live:${trainNo}`;

  const result = await cache.getOrFetch(
    cacheKey,
    CACHE.LIVE_STATUS,
    async (): Promise<{ data: LiveStatus; fallback?: string }> => {
      const apiKey = resolveApiKey(request.headers.get('x-railradar-key'));
      const upstream = await railradarGet(
        `trains/${encodeURIComponent(trainNo)}/live?includeCoordinates=true`,
        apiKey
      );

      if (upstream.ok && upstream.data) {
        // Prefer the provider-specific mapper; the generic normalizer is only a
        // best-effort guess for payload shapes we haven't verified.
        const data = isRailRadarLive(upstream.data)
          ? mapRailRadarLive(upstream.data, trainNo)
          : { ...normalizeLiveStatus(upstream.data, trainNo), dataSource: 'live' as const };
        return { data };
      }

      log.error('upstream unavailable', { error: upstream.error });
      throw new Error(upstream.error || 'Upstream provider unavailable');
    }
  ).catch((err: any) => {
    return error(502, 'BAD_GATEWAY', err.message || 'Live tracking data is currently unavailable from the provider.', { requestId });
  });

  if (result instanceof Response) {
    return result;
  }

  return ok(result.data, {
    fallback: result.fallback,
    cacheControl: {
      maxAge: CACHE.LIVE_STATUS / 1000,
      sMaxAge: CACHE.LIVE_STATUS / 1000,
      staleWhileRevalidate: 30,
    },
    requestId,
  });
}
