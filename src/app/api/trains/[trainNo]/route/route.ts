import { NextRequest } from 'next/server';

import { normalizeRouteData } from '@/services/api-normalizer';
import { railradarGet, resolveApiKey } from '@/services/railradar';
import { isRailRadarRoute, mapRailRadarRoute } from '@/services/railradar-mapper';
import { cache } from '@/lib/cache';
import { ok, error, getRequestId, rateLimitRequest } from '@/lib/http';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/constants';
import type { RouteData } from '@/types/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trainNo: string }> }
) {
  const { trainNo } = await params;
  const requestId = getRequestId(request);
  const log = logger.child({ route: 'trains/route', requestId, trainNo });

  if (!/^[a-zA-Z0-9_-]{1,16}$/.test(trainNo)) {
    return error(400, 'INVALID_TRAIN_NO', 'Invalid train number', { requestId });
  }

  const limited = await rateLimitRequest(request, {
    limit: 90,
    windowMs: 60_000,
  }, 'route');
  if (!limited.allowed) {
    log.warn('rate limited');
    return error(429, 'RATE_LIMITED', 'Too many requests — slow down', {
      retryAfter: limited.retryAfterSec,
      requestId,
    });
  }

  const cacheKey = `route:${trainNo}`;

  const result = await cache.getOrFetch(
    cacheKey,
    CACHE.ROUTE,
    async (): Promise<{ data: RouteData; fallback?: string }> => {
      const fallback: RouteData = {
        polyline: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
        stations: [],
        totalDistance: 0,
        dataSource: 'live',
      };

      const apiKey = resolveApiKey(request.headers.get('x-railradar-key'));
      const safeTrainNo = encodeURIComponent(trainNo);

      // The route endpoint returns geometry only — it carries no station list —
      // so the halts come from the live payload. Both are fetched together.
      const [routeResult, liveResult] = await Promise.all([
        railradarGet(`trains/${safeTrainNo}/route?format=geojson`, apiKey),
        railradarGet(`trains/${safeTrainNo}/live?includeCoordinates=true`, apiKey),
      ]);

      if (routeResult.ok && isRailRadarRoute(routeResult.data)) {
        return { data: mapRailRadarRoute(routeResult.data, liveResult.data, fallback) };
      }

      if (routeResult.ok && routeResult.data) {
        return {
          data: { ...normalizeRouteData(routeResult.data, trainNo), dataSource: 'live' as const },
        };
      }

      log.error('upstream unavailable', { error: routeResult.error });
      throw new Error(routeResult.error || 'Upstream provider unavailable');
    }
  ).catch((err: any) => {
    return error(502, 'BAD_GATEWAY', err.message || 'Route data is currently unavailable from the provider.', { requestId });
  });

  if (result instanceof Response) {
    return result;
  }

  return ok(result.data, {
    fallback: result.fallback,
    cacheControl: {
      maxAge: CACHE.ROUTE / 1000,
      sMaxAge: CACHE.ROUTE / 1000,
      staleWhileRevalidate: CACHE.ROUTE / 1000,
    },
    requestId,
  });
}
