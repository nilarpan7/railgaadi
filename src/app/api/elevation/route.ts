import { NextRequest } from 'next/server';
import { upstreamFetch } from '@/lib/upstream';
import { cache } from '@/lib/cache';
import { ok, error, getRequestId, rateLimitRequest } from '@/lib/http';
import { logger } from '@/lib/logger';
import { fingerprint } from '@/lib/hash';
import { CACHE } from '@/lib/constants';

interface ElevationPoint {
  distance: number; // km from the first coordinate
  elevation: number; // metres
  lat: number;
  lng: number;
}

interface TopoResponse {
  results?: Array<{
    elevation: number | null;
    location?: { lat: number; lng: number };
  }>;
}

const EARTH_RADIUS_KM = 6371;

function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * POST { coordinates: [lng, lat][] }
 *
 * Coordinates are GeoJSON order — `[lng, lat]` — to match
 * `RouteData.polyline.geometry.coordinates`, which is the only thing in the app
 * that produces them. OpenTopoData wants `lat,lng`, so they're swapped on the
 * way out.
 *
 * Distances are measured along the supplied path rather than assumed: this route
 * previously spread every train's profile over a hardcoded 1384 km (the length
 * of one specific Delhi–Mumbai run), so every other train's chart was wrong.
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = logger.child({ route: 'elevation', requestId });

  const limited = await rateLimitRequest(request, { limit: 120, windowMs: 60_000 }, 'elevation');
  if (!limited.allowed) {
    log.warn('rate limited');
    return error(429, 'RATE_LIMITED', 'Too many requests', {
      retryAfter: limited.retryAfterSec,
      requestId,
    });
  }

  let coordinates: [number, number][];

  try {
    const body = await request.json();
    coordinates = body?.coordinates;
  } catch {
    return error(400, 'INVALID_BODY', 'Invalid request body', { requestId });
  }

  const isPair = (value: unknown): value is [number, number] =>
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]);

  if (!Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.every(isPair)) {
    return error(
      400,
      'INVALID_COORDINATES',
      'coordinates must be an array of at least two [lng, lat] pairs',
      { requestId }
    );
  }

  // Cap the input size so a malicious request can't force a huge in-memory
  // array before it's sampled down.
  if (coordinates.length > 5000) {
    coordinates = coordinates.slice(0, 5000);
  }

  // Sample down to fit OpenTopoData's URL length limit, always keeping the last
  // point so the profile spans the whole route.
  const MAX_SAMPLES = 50;
  const step = Math.max(1, Math.ceil(coordinates.length / MAX_SAMPLES));
  const sampled = coordinates.filter((_, i) => i % step === 0);
  const last = coordinates[coordinates.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);

  // Cumulative great-circle distance along the sampled path.
  const distances: number[] = [0];
  for (let i = 1; i < sampled.length; i += 1) {
    distances.push(distances[i - 1] + haversine(sampled[i - 1], sampled[i]));
  }

  // Fingerprint the full sampled path so distinct geometries with the same
  // endpoints and sample count don't collide.
  const cacheKey = `elevation:${fingerprint(sampled.map((p) => p.join(',')).join(';'))}`;

  class ElevationUpstreamError extends Error {
    constructor(reason: string) {
      super(reason);
      this.name = 'ElevationUpstreamError';
    }
  }

  try {
    const points = await cache.getOrFetch(
      cacheKey,
      CACHE.ELEVATION,
      async (): Promise<ElevationPoint[]> => {
        const locations = sampled.map(([lng, lat]) => `${lat},${lng}`).join('|');
        const upstream = await upstreamFetch<TopoResponse>(
          'opentopodata',
          `https://api.opentopodata.org/v1/srtm30m?locations=${locations}`,
          { timeoutMs: 8000, idempotent: true, retries: 1 }
        );

        if (upstream.ok) {
          const results = upstream.data?.results;
          if (Array.isArray(results) && results.length === sampled.length) {
            return results.map(
              (entry, i): ElevationPoint => ({
                distance: Math.round(distances[i] * 10) / 10,
                elevation: Math.round(entry.elevation ?? 0),
                lat: entry.location?.lat ?? sampled[i][1],
                lng: entry.location?.lng ?? sampled[i][0],
              })
            );
          }
        }

        throw new ElevationUpstreamError(upstream.error ?? 'invalid elevation response');
      }
    );

    return ok(points, {
      cacheControl: { maxAge: CACHE.ELEVATION / 1000, sMaxAge: CACHE.ELEVATION / 1000 },
      requestId,
    });
  } catch (caught) {
    if (caught instanceof ElevationUpstreamError) {
      log.warn('opentopodata unavailable — serving synthetic profile', {
        error: caught.message,
      });
      // Synthetic profile, flagged in the response header so a caller can avoid
      // presenting invented terrain as a survey. Cached short so a recovered
      // upstream is picked up quickly.
      const synthetic: ElevationPoint[] = sampled.map(([lng, lat], i) => ({
        distance: Math.round(distances[i] * 10) / 10,
        elevation: Math.round(220 + Math.sin(i * 0.4) * 120 + Math.cos(i * 0.1) * 80),
        lat,
        lng,
      }));
      return ok(synthetic, {
        fallback: 'synthetic',
        cacheControl: { maxAge: 300 },
        requestId,
      });
    }
    throw caught;
  }
}
