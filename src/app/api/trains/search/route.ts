import { NextRequest } from 'next/server';
import { searchMockTrains } from '@/services/mock-data';
import { railradarGet, resolveApiKey } from '@/services/railradar';
import { isRailRadarTrain, mapRailRadarTrain } from '@/services/railradar-mapper';
import { cache } from '@/lib/cache';
import { ok, error, getRequestId, rateLimitRequest } from '@/lib/http';
import { logger } from '@/lib/logger';
import { fingerprint } from '@/lib/hash';
import { CACHE } from '@/lib/constants';
import type { Train } from '@/types/train';

/**
 * RailRadar exposes no name-search endpoint on this plan — `/v1/trains?q=` is a
 * 404 and `/v1/trains/search?q=` rejects with "Train number must be 5 digits".
 * Only `/v1/trains/{5-digit}` resolves. So a numeric query goes upstream for
 * authoritative data and everything else searches the local directory.
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const query = request.nextUrl.searchParams.get('q')?.trim();
  const log = logger.child({ route: 'trains/search', requestId, query });

  if (!query || query.length < 2) {
    return ok([] as Train[], { requestId });
  }

  const limited = await rateLimitRequest(request, {
    limit: 60,
    windowMs: 60_000,
  }, 'search');
  if (!limited.allowed) {
    log.warn('rate limited');
    return error(429, 'RATE_LIMITED', 'Too many search requests', {
      retryAfter: limited.retryAfterSec,
      requestId,
    });
  }

  const apiKey = resolveApiKey(request.headers.get('x-railradar-key'));
  const cacheKey = `search:${query.toLowerCase()}:${fingerprint(apiKey ?? 'server')}`;

  const result = await cache.getOrFetch(
    cacheKey,
    CACHE.SEARCH,
    async (): Promise<{ data: Train[]; fallback?: string }> => {
      const local = searchMockTrains(query);

      if (/^\d{5}$/.test(query)) {
        const upstream = await railradarGet(`trains/${query}`, apiKey, 6000);

        if (upstream.ok && isRailRadarTrain(upstream.data)) {
          const train = mapRailRadarTrain(upstream.data);
          if (train) {
            // Upstream result first, then any other local matches that aren't it.
            return {
              data: [train, ...local.filter((entry) => entry.number !== train.number)],
            };
          }
        }

        if (!upstream.ok) {
          log.warn('upstream unavailable — using local directory', {
            error: upstream.error,
          });
        }
      }

      return { data: local, fallback: 'local' };
    }
  );

  return ok(result.data, {
    fallback: result.fallback,
    cacheControl: {
      maxAge: CACHE.SEARCH / 1000,
      sMaxAge: CACHE.SEARCH / 1000,
      staleWhileRevalidate: CACHE.SEARCH / 1000,
    },
    requestId,
  });
}
