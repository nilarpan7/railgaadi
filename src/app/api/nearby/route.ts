import { NextRequest } from 'next/server';
import { upstreamFetch } from '@/lib/upstream';
import { cache } from '@/lib/cache';
import { ok, error, getRequestId, rateLimitRequest } from '@/lib/http';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/constants';

interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
  description: string;
  tags?: Record<string, string>;
}

interface OverpassElement {
  id: number;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = logger.child({ route: 'nearby', requestId });

  const lat = request.nextUrl.searchParams.get('lat');
  const lng = request.nextUrl.searchParams.get('lng');
  const radius = request.nextUrl.searchParams.get('radius') || '8000';

  const latF = Number(lat);
  const lngF = Number(lng);
  const radiusF = Number.parseInt(radius, 10);

  // Unvalidated params used to be interpolated straight into the Overpass query,
  // so a non-numeric value produced `around:NaN,NaN,NaN` and a wasted upstream
  // call.
  if (!Number.isFinite(latF) || !Number.isFinite(lngF) || Math.abs(latF) > 90 || Math.abs(lngF) > 180) {
    return error(400, 'INVALID_COORDINATES', 'valid lat and lng required', { requestId });
  }

  const limited = await rateLimitRequest(request, { limit: 120, windowMs: 60_000 }, 'nearby');
  if (!limited.allowed) {
    log.warn('rate limited');
    return error(429, 'RATE_LIMITED', 'Too many requests', {
      retryAfter: limited.retryAfterSec,
      requestId,
    });
  }

  const safeRadius = Number.isFinite(radiusF) ? Math.min(50000, Math.max(500, radiusF)) : 8000;

  const cacheKey = `nearby:${latF.toFixed(1)}:${lngF.toFixed(1)}:${safeRadius}`;

  class OverpassUpstreamError extends Error {
    constructor(reason: string) {
      super(reason);
      this.name = 'OverpassUpstreamError';
    }
  }

  try {
    const places = await cache.getOrFetch(cacheKey, CACHE.NEARBY, async (): Promise<NearbyPlace[]> => {
      const query = `
        [out:json][timeout:15];
        (
          way["waterway"="river"](around:${safeRadius},${latF},${lngF});
          node["natural"="peak"](around:${safeRadius},${latF},${lngF});
          way["bridge"](around:${safeRadius},${latF},${lngF});
          way["tunnel"](around:${safeRadius},${latF},${lngF});
          nwr["tourism"](around:${safeRadius},${latF},${lngF});
        );
        out center body;
      `;

      const response = await upstreamFetch<{ elements?: OverpassElement[] }>('overpass', 'https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          // Overpass answers 406 Not Acceptable to requests without an
          // identifying User-Agent — Node's fetch sends none, which is why this
          // endpoint silently returned nothing while the same query worked in curl.
          'User-Agent': 'RailGaadi/1.0 (+https://github.com/railgaadi)',
        },
        body: `data=${encodeURIComponent(query)}`,
        timeoutMs: 12000,
        circuit: 'overpass',
        // POST here is a read-only Overpass query; retrying it is safe — but
        // Overpass sheds load aggressively with 429/504, so keep to one attempt.
        idempotent: true,
        retries: 0,
      });

      if (response.ok && Array.isArray(response.data?.elements)) {
        return parseOverpassResponse(response.data.elements, latF, lngF);
      }

      log.warn('overpass unavailable', { error: response.error, status: response.status });
      throw new OverpassUpstreamError(response.error ?? 'overpass returned no elements');
    });

    return ok(places, {
      cacheControl: { maxAge: 1800, sMaxAge: CACHE.NEARBY / 1000 },
      requestId,
    });
  } catch (caught) {
    if (caught instanceof OverpassUpstreamError) {
      // No invented landmarks. An empty list is honest and the UI already
      // renders an empty state for it.
      return ok([] as NearbyPlace[], {
        fallback: 'none',
        cacheControl: { maxAge: 300 },
        requestId,
      });
    }
    throw caught;
  }
}

function parseOverpassResponse(
  elements: OverpassElement[],
  centerLat: number,
  centerLng: number
): NearbyPlace[] {
  const places = elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const elLat = el.lat || el.center?.lat || centerLat;
      const elLng = el.lon || el.center?.lon || centerLng;

      let category = 'tourist';
      if (el.tags?.waterway === 'river') category = 'river';
      else if (el.tags?.natural === 'peak') category = 'mountain';
      else if (el.tags?.bridge) category = 'bridge';
      else if (el.tags?.tunnel) category = 'tunnel';
      else if (el.tags?.tourism) category = 'tourist';

      const distance = haversine(centerLat, centerLng, elLat, elLng);

      return {
        id: `osm-${el.id}`,
        name: el.tags!.name,
        category,
        lat: elLat,
        lng: elLng,
        distance: Math.round(distance * 10) / 10,
        description: el.tags?.description || el.tags?.tourism || `${category} landmark`,
        tags: el.tags || {},
      };
    })
    .sort((a, b) => a.distance - b.distance);

  // OSM splits a single real-world feature across many ways — a flyover shows up
  // once per carriageway segment — so the nearest of each name/category wins and
  // the rest are dropped. Otherwise one bridge could fill the whole list.
  const seen = new Set<string>();
  const deduped: NearbyPlace[] = [];

  for (const place of places) {
    const key = `${place.category}:${place.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(place);
    if (deduped.length === 15) break;
  }

  return deduped;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
