import type { Train, LiveStatus, StationStatus, Station } from '@/types/train';
import type { RouteData, RouteStation } from '@/types/route';
import { STATIONS, TRAINS } from './catalog';

/**
 * Upstream providers (RailRadar and friends) are inconsistent about casing,
 * nesting and types, so every field is read defensively. Everything in here
 * takes `unknown` and narrows — no `any`.
 */

type Rec = Record<string, unknown>;

function isRec(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `{}` for anything that isn't a plain object, so `.x` lookups stay safe. */
function rec(value: unknown): Rec {
  return isRec(value) ? value : {};
}

/** First meaningful value across a list of candidate keys. `0` and `false` count. */
function pick(source: Rec, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function str(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function num(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Pulls the payload out of `{ data: … }` envelopes. */
function unwrap(raw: unknown): Rec {
  const root = rec(raw);
  return isRec(root.data) ? root.data : root;
}

/** Finds the first array under any of `keys`. */
function pickArray(source: Rec, ...keys: string[]): unknown[] {
  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key] as unknown[];
  }
  return [];
}

// ============================================
// Train Search Normalizer
// ============================================
export function normalizeSearchResults(raw: unknown, query: string): Train[] {
  if (!raw) return [];

  // Handles [...], { data: [...] }, { trains: [...] } and { data: {...} }
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else {
    const root = rec(raw);
    const fromKeys = pickArray(root, 'data', 'trains', 'results');
    if (fromKeys.length) list = fromKeys;
    else if (isRec(root.data)) list = [root.data];
  }

  if (list.length === 0) return [];

  const trains = list.map((entry, index): Train => {
    const item = rec(entry);

    const number = str(
      pick(item, 'number', 'trainNumber', 'train_number', 'id'),
      `1000${index}`
    );
    const name = str(
      pick(item, 'name', 'trainName', 'train_name'),
      `Train ${number}`
    );

    const source = rec(item.source);
    const destination = rec(item.destination);

    const srcCode = str(
      pick(item, 'sourceCode', 'source_code') ??
        pick(source, 'code') ??
        pick(item, 'from'),
      'NDLS'
    ).toUpperCase();
    const dstCode = str(
      pick(item, 'destinationCode', 'destination_code') ??
        pick(destination, 'code') ??
        pick(item, 'to'),
      'BCT'
    ).toUpperCase();

    const sourceStation: Station = {
      code: srcCode,
      name: str(
        pick(item, 'sourceName', 'source_name') ??
          pick(source, 'name') ??
          (typeof item.source === 'string' ? item.source : undefined) ??
          STATIONS[srcCode]?.name,
        srcCode
      ),
      lat: num(pick(source, 'lat', 'latitude') ?? STATIONS[srcCode]?.lat, 28.6423),
      lng: num(pick(source, 'lng', 'longitude') ?? STATIONS[srcCode]?.lng, 77.2199),
    };

    const destinationStation: Station = {
      code: dstCode,
      name: str(
        pick(item, 'destinationName', 'destination_name') ??
          pick(destination, 'name') ??
          (typeof item.destination === 'string' ? item.destination : undefined) ??
          STATIONS[dstCode]?.name,
        dstCode
      ),
      lat: num(
        pick(destination, 'lat', 'latitude') ?? STATIONS[dstCode]?.lat,
        18.9712
      ),
      lng: num(
        pick(destination, 'lng', 'longitude') ?? STATIONS[dstCode]?.lng,
        72.8197
      ),
    };

    const days = pickArray(item, 'runsOn', 'days').filter(
      (d): d is string => typeof d === 'string'
    );

    return {
      id: number,
      number,
      name,
      source: sourceStation,
      destination: destinationStation,
      type: str(
        pick(item, 'type', 'trainType', 'category'),
        'SuperFast'
      ) as Train['type'],
      days: days.length ? days : ['Daily'],
      departureTime: str(pick(item, 'departureTime', 'departure'), '08:00'),
      arrivalTime: str(pick(item, 'arrivalTime', 'arrival'), '22:00'),
      duration: str(pick(item, 'duration'), '14h 00m'),
      totalDistance: num(pick(item, 'distance', 'totalDistance'), 1350),
      numberOfStops: num(pick(item, 'numberOfStops', 'stopsCount'), 10),
    };
  });

  const q = query.trim().toLowerCase();
  if (!q) return trains;

  // Some upstream endpoints ignore the query and return a generic list —
  // rank the closest matches first so the UI still feels responsive.
  const score = (train: Train) => {
    const number = train.number.toLowerCase();
    const name = train.name.toLowerCase();
    if (number === q) return 0;
    if (number.startsWith(q)) return 1;
    if (name.startsWith(q)) return 2;
    if (number.includes(q) || name.includes(q)) return 3;
    return 4;
  };

  return [...trains].sort((a, b) => score(a) - score(b));
}

// ============================================
// Live Status Normalizer
// ============================================

/**
 * Deterministic platform guess. Random values would change on every 15s poll
 * and make the UI flicker, so derive a stable number from the station index.
 */
function fallbackPlatform(index: number): number {
  return ((index * 3) % 6) + 1;
}

export function normalizeLiveStatus(raw: unknown, trainNo: string): LiveStatus {
  if (!raw) throw new Error('No live status data available');

  const data = unwrap(raw);
  const knownTrain = TRAINS.find((t) => t.number === trainNo);

  const number = str(pick(data, 'trainNumber', 'number'), trainNo);
  const name = str(
    pick(data, 'trainName', 'name') ?? knownTrain?.name,
    `Train ${number}`
  );

  const location = rec(data.currentLocation);
  const lat = num(
    pick(location, 'lat', 'latitude') ?? pick(data, 'latitude', 'lat'),
    23.5
  );
  const lng = num(
    pick(location, 'lng', 'longitude') ?? pick(data, 'longitude', 'lng'),
    75.5
  );

  const speed = num(
    pick(data, 'speed', 'currentSpeed') ?? pick(location, 'speed'),
    75
  );
  const delay = num(
    pick(data, 'delay', 'delayMinutes', 'delay_minutes', 'lateMinutes'),
    0
  );

  const currentRaw = rec(data.currentStation);
  const nextRaw = rec(data.nextStation);
  const lastRaw = rec(data.lastStation);
  const destinationRaw = rec(data.destination);

  const currCode = str(
    pick(currentRaw, 'code') ?? pick(data, 'current_station_code'),
    knownTrain?.source.code ?? 'NDLS'
  ).toUpperCase();
  const nextCode = str(
    pick(nextRaw, 'code') ?? pick(data, 'next_station_code'),
    'AGC'
  ).toUpperCase();
  const lastCode = str(
    pick(lastRaw, 'code') ?? pick(destinationRaw, 'code'),
    knownTrain?.destination.code ?? 'BCT'
  ).toUpperCase();

  const currentStation: Station = {
    code: currCode,
    name: str(
      pick(currentRaw, 'name') ??
        pick(data, 'current_station_name') ??
        STATIONS[currCode]?.name,
      currCode
    ),
    lat: num(pick(currentRaw, 'lat') ?? STATIONS[currCode]?.lat, lat),
    lng: num(pick(currentRaw, 'lng') ?? STATIONS[currCode]?.lng, lng),
  };

  const nextStation: Station = {
    code: nextCode,
    name: str(
      pick(nextRaw, 'name') ??
        pick(data, 'next_station_name') ??
        STATIONS[nextCode]?.name,
      nextCode
    ),
    lat: num(pick(nextRaw, 'lat') ?? STATIONS[nextCode]?.lat, lat + 0.5),
    lng: num(pick(nextRaw, 'lng') ?? STATIONS[nextCode]?.lng, lng + 0.5),
  };

  const lastStation: Station = {
    code: lastCode,
    name: str(
      pick(lastRaw, 'name') ??
        pick(destinationRaw, 'name') ??
        STATIONS[lastCode]?.name,
      lastCode
    ),
    lat: num(
      pick(lastRaw, 'lat') ?? STATIONS[lastCode]?.lat ?? knownTrain?.destination.lat,
      18.97
    ),
    lng: num(
      pick(lastRaw, 'lng') ?? STATIONS[lastCode]?.lng ?? knownTrain?.destination.lng,
      72.81
    ),
  };

  const totalDistance = num(
    pick(data, 'totalDistance', 'distance') ?? knownTrain?.totalDistance,
    1384
  );
  const progress = num(pick(data, 'progress', 'journeyProgress'), 45);
  const distanceCovered = num(
    pick(data, 'distanceCovered'),
    Math.round((progress / 100) * totalDistance)
  );
  const distanceRemaining = num(
    pick(data, 'distanceRemaining'),
    Math.max(0, totalDistance - distanceCovered)
  );

  // Station statuses
  const scheduleList = pickArray(
    data,
    'stationStatuses',
    'stations',
    'schedule'
  );

  let stationStatuses: StationStatus[] = scheduleList.map(
    (entry, idx): StationStatus => {
      const st = rec(entry);
      const nested = rec(st.station);

      const stCode = str(
        pick(st, 'code', 'stationCode') ?? pick(nested, 'code'),
        `STN${idx}`
      ).toUpperCase();
      const stName = str(
        pick(st, 'name', 'stationName') ??
          pick(nested, 'name') ??
          STATIONS[stCode]?.name,
        stCode
      );

      const platformRaw = pick(st, 'platform');

      return {
        station: {
          code: stCode,
          name: stName,
          lat: num(
            pick(st, 'lat', 'latitude') ?? STATIONS[stCode]?.lat,
            20 + idx * 0.5
          ),
          lng: num(
            pick(st, 'lng', 'longitude') ?? STATIONS[stCode]?.lng,
            75 + idx * 0.5
          ),
        },
        scheduledArrival: str(pick(st, 'scheduledArrival', 'schArr'), '08:00'),
        scheduledDeparture: str(
          pick(st, 'scheduledDeparture', 'schDep'),
          '08:05'
        ),
        actualArrival: strOrNull(pick(st, 'actualArrival', 'actArr')),
        actualDeparture: strOrNull(pick(st, 'actualDeparture', 'actDep')),
        delay: num(pick(st, 'delay', 'delayMinutes'), 0),
        platform:
          platformRaw === undefined
            ? fallbackPlatform(idx)
            : num(platformRaw, fallbackPlatform(idx)),
        distanceFromSource: num(
          pick(st, 'distanceFromSource', 'distance'),
          idx * 100
        ),
        haltTime: num(pick(st, 'haltTime'), 5),
        status: str(
          pick(st, 'status'),
          idx < 3 ? 'visited' : idx === 3 ? 'current' : 'upcoming'
        ) as StationStatus['status'],
        day: num(pick(st, 'day'), 1),
      };
    }
  );

  // Throw error if upstream sent nothing usable instead of mocking.
  if (stationStatuses.length === 0) {
    throw new Error('No usable schedule data received from upstream');
  }

  const currentPlatformRaw = pick(data, 'currentPlatform');

  return {
    trainNumber: number,
    trainName: name,
    currentLocation: { lat, lng },
    speed,
    delay,
    currentStation,
    nextStation,
    previousStation: currentStation,
    lastStation,
    eta: str(pick(data, 'eta'), new Date(Date.now() + 6 * 3600000).toISOString()),
    nextStationEta: str(
      pick(data, 'nextStationEta'),
      new Date(Date.now() + 30 * 60000).toISOString()
    ),
    progress: Math.min(100, Math.max(0, progress)),
    distanceCovered,
    distanceRemaining,
    totalDistance,
    status:
      delay > 10
        ? 'delayed'
        : (str(pick(data, 'status'), 'running') as LiveStatus['status']),
    updatedAt: str(pick(data, 'updatedAt'), new Date().toISOString()),
    stationStatuses,
    currentPlatform:
      currentPlatformRaw === undefined ? 3 : num(currentPlatformRaw, 3),
  };
}

// ============================================
// Route Data Normalizer
// ============================================

function isLineString(value: unknown): value is GeoJSON.LineString {
  return (
    isRec(value) && value.type === 'LineString' && Array.isArray(value.coordinates)
  );
}

function isLineFeature(
  value: unknown
): value is GeoJSON.Feature<GeoJSON.LineString> {
  return isRec(value) && value.type === 'Feature' && isLineString(value.geometry);
}

/** Accepts `[lng, lat]`, `[lat, lng]` and `{ lat, lng }`, always returns `[lng, lat]`. */
function toCoordinate(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const a = num(value[0], NaN);
    const b = num(value[1], NaN);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    // Indian longitudes are 68–98, latitudes 6–37: the value over 50 is the lng.
    return a > 50 ? [a, b] : [b, a];
  }
  if (isRec(value)) {
    const lng = num(pick(value, 'lng', 'longitude', 'lon'), NaN);
    const lat = num(pick(value, 'lat', 'latitude'), NaN);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
  }
  return null;
}

function lineFeature(
  coordinates: [number, number][]
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };
}

export function normalizeRouteData(raw: unknown, trainNo: string): RouteData {
  const train = TRAINS.find((t) => t.number === trainNo) ?? TRAINS[0];

  if (!raw) {
    return {
      polyline: lineFeature([
        [train.source.lng, train.source.lat],
        [train.destination.lng, train.destination.lat],
      ]),
      stations: [
        { station: train.source, distanceFromSource: 0, positionOnLine: 0 },
        {
          station: train.destination,
          distanceFromSource: train.totalDistance,
          positionOnLine: 1,
        },
      ],
      totalDistance: train.totalDistance,
    };
  }

  const data = unwrap(raw);

  let polyline: GeoJSON.Feature<GeoJSON.LineString>;
  if (isLineFeature(data.polyline)) {
    polyline = data.polyline;
  } else if (isLineString(data.geometry)) {
    polyline = { type: 'Feature', properties: {}, geometry: data.geometry };
  } else if (Array.isArray(data.coordinates)) {
    const coords = data.coordinates
      .map(toCoordinate)
      .filter((c): c is [number, number] => c !== null);
    polyline = lineFeature(
      coords.length >= 2
        ? coords
        : [
            [train.source.lng, train.source.lat],
            [train.destination.lng, train.destination.lat],
          ]
    );
  } else {
    polyline = lineFeature([
      [train.source.lng, train.source.lat],
      [train.destination.lng, train.destination.lat],
    ]);
  }

  const rawStations = pickArray(data, 'stations', 'route', 'schedule');
  const stations: RouteStation[] = rawStations.map((entry, idx): RouteStation => {
    const s = rec(entry);
    const nested = rec(s.station);

    const code = str(
      pick(s, 'code', 'stationCode') ?? pick(nested, 'code'),
      `STN${idx}`
    ).toUpperCase();

    return {
      station: {
        code,
        name: str(
          pick(s, 'name', 'stationName') ??
            pick(nested, 'name') ??
            STATIONS[code]?.name,
          code
        ),
        lat: num(pick(s, 'lat', 'latitude') ?? STATIONS[code]?.lat, 20 + idx),
        lng: num(pick(s, 'lng', 'longitude') ?? STATIONS[code]?.lng, 75 + idx),
      },
      distanceFromSource: num(
        pick(s, 'distanceFromSource', 'distance'),
        idx * 100
      ),
      positionOnLine: idx / Math.max(1, rawStations.length - 1),
    };
  });

  return {
    polyline,
    stations,
    totalDistance: num(
      pick(data, 'totalDistance', 'distance'),
      train.totalDistance
    ),
  };
}
