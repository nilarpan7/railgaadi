/**
 * Precise mappers for RailRadar's documented response shape.
 *
 * These exist because the generic `api-normalizer` guesses at field names and
 * guessed wrong for this provider — it looked for `currentLocation.lat`,
 * `data.speed`, `data.currentStation`, `data.stationStatuses` and
 * `data.polyline`, none of which RailRadar sends. Every miss fell through to a
 * hardcoded default, so the UI rendered a fabricated schedule while the train
 * name looked correct.
 *
 * Shape verified against the live API on 2026-08-24 for train 12952:
 *
 *   data.train.{number,name,type,distance,duration,avgSpeed,source,destination}
 *   data.currentLocation.{stationCode,stationName,sequence,status,
 *                         coordinates:{lat,lng},distanceFromOriginKm,delayMinutes}
 *   data.previousHalt.{stationCode,stationName,sequence,distance}
 *   data.delayMinutes, data.status, data.isLive, data.lastUpdatedAt
 *   data.route[] .{sequence,stationCode,stationName,isHalt,status,lat,lng,
 *                  scheduledArrival,scheduledDeparture,actualArrival,
 *                  actualDeparture,delayArrival,delayDeparture,platform,
 *                  distance,speedToNextStationKmph,arrivalDay,departureDay}
 *
 * Note `route[]` carries *every* track point (237 entries for 12952) and only
 * `isHalt === true` entries are booked stops (8 of them) — the timeline must be
 * built from the halts, not the raw list.
 */

import type {
  LiveStatus,
  Station,
  StationStatus,
  Train,
  TrainStatus,
  TrainType,
} from '@/types/train';
import type { RouteData, RouteStation } from '@/types/route';

type Rec = Record<string, unknown>;

const IST = 'Asia/Kolkata';

const istClockFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: IST,
});

function isRec(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rec(value: unknown): Rec {
  return isRec(value) ? value : {};
}

function numOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function num(value: unknown, fallback: number): number {
  return numOrNull(value) ?? fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * RailRadar sends full offset-aware ISO timestamps
 * (`2026-08-24T00:30:00+05:30`), but `StationStatus` times feed `formatTime()`,
 * which splits on `:` and expects `HH:mm`. Passing the ISO string straight
 * through rendered `NaN:30 PM`. Convert to an IST wall clock.
 */
function istClock(value: unknown): string | null {
  const raw = strOrNull(value);
  if (!raw) return null;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return istClockFormatter.format(parsed);

  // Already a bare clock time.
  const match = /^(\d{1,2}):(\d{2})/.exec(raw);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
}

/** Keep the offset-aware ISO form for fields typed as timestamps (ETA etc.). */
function isoOrNull(value: unknown): string | null {
  const raw = strOrNull(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function minutesBetween(from: unknown, to: unknown): number {
  const a = strOrNull(from);
  const b = strOrNull(to);
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}

/** `'departed' | 'at-station' | …` → the app's four-state station status. */
function mapStationStatus(
  raw: unknown,
  isCurrent: boolean,
  isPast: boolean
): StationStatus['status'] {
  const value = String(raw ?? '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-');

  if (value === 'at-station' || value === 'arriving' || value === 'current') {
    return 'current';
  }
  if (value === 'departed' || value === 'arrived' || value === 'visited') {
    return 'visited';
  }
  if (value === 'skipped' || value === 'cancelled') return 'skipped';

  if (isCurrent) return 'current';
  return isPast ? 'visited' : 'upcoming';
}

function mapTrainStatus(raw: unknown, delayMinutes: number): TrainStatus {
  const value = String(raw ?? '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-');

  if (value.includes('cancel')) return 'cancelled';
  if (value.includes('resched') || value.includes('divert')) return 'rescheduled';
  if (value.includes('complet') || value.includes('terminat')) return 'completed';
  if (value.includes('not-start') || value.includes('yet-to')) return 'not-started';
  // Only a train that is actually moving can be "delayed" — a finished run that
  // arrived late is `completed`, which the old code overwrote with `delayed`.
  if (delayMinutes > 10) return 'delayed';
  return 'running';
}

function stationFrom(entry: Rec, fallbackLat: number, fallbackLng: number): Station {
  const code = String(entry.stationCode ?? entry.code ?? '').toUpperCase();
  return {
    code,
    name: strOrNull(entry.stationName) ?? strOrNull(entry.name) ?? code,
    lat: num(entry.lat ?? rec(entry.coordinates).lat, fallbackLat),
    lng: num(entry.lng ?? rec(entry.coordinates).lng, fallbackLng),
  };
}

/** True when the payload looks like RailRadar's live-status shape. */
export function isRailRadarLive(raw: unknown): boolean {
  const data = isRec(raw) && isRec(raw.data) ? (raw.data as Rec) : rec(raw);
  return Array.isArray(data.route) && isRec(data.train);
}

/** True when the payload looks like RailRadar's `format=geojson` route shape. */
export function isRailRadarRoute(raw: unknown): boolean {
  const data = isRec(raw) && isRec(raw.data) ? (raw.data as Rec) : rec(raw);
  return isRec(data.geojson);
}

/* ==============================================================
   Live status
   ============================================================== */

export function mapRailRadarLive(raw: unknown, trainNo: string): LiveStatus {
  const data = isRec(raw) && isRec(raw.data) ? (raw.data as Rec) : rec(raw);
  const train = rec(data.train);
  const location = rec(data.currentLocation);
  const coordinates = rec(location.coordinates);

  const source = rec(train.source);
  const destination = rec(train.destination);

  const allPoints = (Array.isArray(data.route) ? data.route : []).map(rec);
  // Booked stops only. `route[]` also contains every intermediate track point,
  // which has no arrival/departure of its own.
  const halts = allPoints.filter((point) => point.isHalt === true);
  const timeline = halts.length > 0 ? halts : allPoints;

  const totalDistance = num(train.distance, num(data.totalDistance, 0));
  const distanceCovered = num(
    location.distanceFromOriginKm,
    num(rec(data.previousHalt).distance, 0)
  );
  const distanceRemaining = Math.max(
    0,
    Math.round((totalDistance - distanceCovered) * 10) / 10
  );

  const currentSequence = num(location.sequence, -1);
  const locationStatus = String(location.status ?? '').toLowerCase();
  const atStation = locationStatus === 'at-station';

  const lat = num(coordinates.lat, num(source.lat, 20.5937));
  const lng = num(coordinates.lng, num(source.lng, 78.9629));

  const delay = num(location.delayMinutes, num(data.delayMinutes, 0));

  /* -- Current / next / previous halts, derived from sequence ------------- */

  const currentPoint =
    allPoints.find((point) => num(point.sequence, -1) === currentSequence) ??
    rec(undefined);

  const nextHalt = timeline.find(
    (point) => num(point.sequence, -1) > currentSequence
  );
  const previousHalt =
    [...timeline]
      .reverse()
      .find((point) => num(point.sequence, -1) < currentSequence) ??
    rec(data.previousHalt);

  const finalHalt = timeline[timeline.length - 1] ?? rec(undefined);

  const currentStation: Station = location.stationCode
    ? stationFrom(location, lat, lng)
    : stationFrom(currentPoint, lat, lng);

  const lastStation: Station = destination.code
    ? {
        code: String(destination.code).toUpperCase(),
        name: strOrNull(destination.name) ?? String(destination.code),
        lat: num(destination.lat, lat),
        lng: num(destination.lng, lng),
      }
    : stationFrom(finalHalt, lat, lng);

  // Journey finished → there is no "next" station; point at the destination.
  const nextStation: Station = nextHalt
    ? stationFrom(nextHalt, lat, lng)
    : lastStation;

  const previousStation: Station = previousHalt.stationCode
    ? stationFrom(previousHalt, lat, lng)
    : currentStation;

  /* -- Speed -------------------------------------------------------------- */

  // RailRadar exposes segment speed rather than an instantaneous reading.
  // Standing at a station means 0, not the segment average.
  const segmentSpeed = num(
    currentPoint.speedToNextStationKmph,
    num(train.avgSpeed, 0)
  );
  const speed = atStation ? 0 : Math.round(segmentSpeed);

  /* -- Timeline ----------------------------------------------------------- */

  const stationStatuses: StationStatus[] = timeline.map((point) => {
    const sequence = num(point.sequence, -1);
    const scheduledArrival = istClock(point.scheduledArrival);
    const scheduledDeparture = istClock(point.scheduledDeparture);
    const status = mapStationStatus(
      point.status,
      sequence === currentSequence,
      sequence < currentSequence
    );

    // RailRadar fills `actualArrival` for halts the train hasn't reached yet —
    // that's a projection, not an observation. Surfacing it as "actual" would
    // claim a future stop had already happened, so it's dropped; the projected
    // lateness still comes through in `delay`.
    const observed = status === 'visited' || status === 'current';

    return {
      station: stationFrom(point, lat, lng),
      scheduledArrival,
      scheduledDeparture,
      actualArrival: observed ? istClock(point.actualArrival) : null,
      actualDeparture: observed ? istClock(point.actualDeparture) : null,
      delay: num(point.delayArrival, num(point.delayDeparture, 0)),
      platform: numOrNull(point.platform),
      distanceFromSource: num(point.distance, 0),
      haltTime: minutesBetween(point.scheduledArrival, point.scheduledDeparture),
      status,
      day: num(point.arrivalDay, num(point.departureDay, 1)),
    };
  });

  /* -- ETAs --------------------------------------------------------------- */

  const eta =
    isoOrNull(finalHalt.actualArrival) ??
    isoOrNull(finalHalt.scheduledArrival) ??
    isoOrNull(data.lastUpdatedAt) ??
    new Date().toISOString();

  const nextStationEta = nextHalt
    ? (isoOrNull(nextHalt.actualArrival) ??
      isoOrNull(nextHalt.scheduledArrival) ??
      eta)
    : eta;

  const progress =
    totalDistance > 0
      ? Math.min(100, Math.max(0, (distanceCovered / totalDistance) * 100))
      : 0;

  return {
    trainNumber: String(data.trainNumber ?? train.number ?? trainNo),
    trainName:
      strOrNull(data.trainName) ?? strOrNull(train.name) ?? `Train ${trainNo}`,
    currentLocation: { lat, lng },
    speed,
    delay,
    currentStation,
    nextStation,
    previousStation,
    lastStation,
    eta,
    nextStationEta,
    progress: Math.round(progress * 10) / 10,
    distanceCovered: Math.round(distanceCovered * 10) / 10,
    distanceRemaining,
    totalDistance: Math.round(totalDistance * 10) / 10,
    status: mapTrainStatus(data.status, delay),
    updatedAt: isoOrNull(data.lastUpdatedAt) ?? new Date().toISOString(),
    stationStatuses,
    currentPlatform: numOrNull(currentPoint.platform),
    dataSource: 'live',
  };
}

/* ==============================================================
   Route geometry
   ============================================================== */

/**
 * RailRadar's route endpoint only ever returns
 * `data.geojson` (a `Feature<LineString>` — 1587 points for 12952) and carries
 * no station list, so the halts are threaded in from the live payload.
 */
export function mapRailRadarRoute(
  rawRoute: unknown,
  rawLive: unknown,
  fallback: RouteData
): RouteData {
  const routeData = isRec(rawRoute) && isRec(rawRoute.data)
    ? (rawRoute.data as Rec)
    : rec(rawRoute);

  const geojson = rec(routeData.geojson);
  const geometry = rec(geojson.geometry);
  const coordinates = Array.isArray(geometry.coordinates)
    ? geometry.coordinates.filter(
        (pair): pair is [number, number] =>
          Array.isArray(pair) &&
          pair.length >= 2 &&
          typeof pair[0] === 'number' &&
          typeof pair[1] === 'number'
      )
    : [];

  const polyline: RouteData['polyline'] =
    coordinates.length >= 2
      ? {
          type: 'Feature',
          properties: isRec(geojson.properties) ? geojson.properties : {},
          geometry: { type: 'LineString', coordinates },
        }
      : fallback.polyline;

  /* -- Stations from the live payload's halts ----------------------------- */

  const liveData = isRec(rawLive) && isRec(rawLive.data)
    ? (rawLive.data as Rec)
    : rec(rawLive);
  const train = rec(liveData.train);
  const allPoints = (Array.isArray(liveData.route) ? liveData.route : []).map(rec);
  const halts = allPoints.filter((point) => point.isHalt === true);
  const timeline = halts.length > 0 ? halts : allPoints;

  const totalDistance = num(train.distance, fallback.totalDistance);

  const stations: RouteStation[] = timeline.map((point) => {
    const distanceFromSource = num(point.distance, 0);
    return {
      station: stationFrom(point, 0, 0),
      distanceFromSource,
      positionOnLine:
        totalDistance > 0
          ? Math.min(1, Math.max(0, distanceFromSource / totalDistance))
          : 0,
    };
  });

  return {
    polyline,
    stations: stations.length > 0 ? stations : fallback.stations,
    totalDistance: totalDistance > 0 ? totalDistance : fallback.totalDistance,
    dataSource: coordinates.length >= 2 ? 'live' : fallback.dataSource,
  };
}

/* ==============================================================
   Train detail  ( GET /v1/trains/{number} )
   ============================================================== */

/**
 * The detail endpoint uses a *third* shape, distinct from `/live`: stations are
 * nested under `station: {...}` and times are bare `HH:mm` strings in
 * `arrival` / `departure` rather than offset-aware ISO timestamps.
 */
const TRAIN_TYPE_PATTERNS: [RegExp, TrainType][] = [
  [/vande\s*bharat/i, 'Vande Bharat'],
  [/rajdhani/i, 'Rajdhani'],
  [/shatabdi/i, 'Shatabdi'],
  [/duronto/i, 'Duronto'],
  [/garib\s*rath/i, 'Garib Rath'],
  [/humsafar/i, 'Humsafar'],
  [/super\s*fast/i, 'SuperFast'],
  [/mail/i, 'Mail'],
  [/local|passenger|memu|emu|dmu/i, 'Local'],
];

function mapTrainType(raw: unknown, name: unknown): TrainType {
  const haystack = `${String(raw ?? '')} ${String(name ?? '')}`;
  for (const [pattern, type] of TRAIN_TYPE_PATTERNS) {
    if (pattern.test(haystack)) return type;
  }
  return 'Express';
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** True when the payload looks like RailRadar's train-detail shape. */
export function isRailRadarTrain(raw: unknown): boolean {
  const data = isRec(raw) && isRec(raw.data) ? (raw.data as Rec) : rec(raw);
  const train = rec(data.train);
  return typeof train.number === 'string' && typeof train.name === 'string';
}

export function mapRailRadarTrain(raw: unknown): Train | null {
  const data = isRec(raw) && isRec(raw.data) ? (raw.data as Rec) : rec(raw);
  const train = rec(data.train);

  const number = strOrNull(train.number);
  const name = strOrNull(train.name);
  if (!number || !name) return null;

  const source = rec(train.source);
  const destination = rec(train.destination);

  const points = (Array.isArray(data.route) ? data.route : []).map(rec);
  const first = points[0] ?? rec(undefined);
  const last = points[points.length - 1] ?? rec(undefined);

  const runDays = Array.isArray(train.runDays) ? train.runDays : [];
  const days = runDays
    .map((day) => DAY_LABELS[String(day).toLowerCase().slice(0, 3)])
    .filter((day): day is string => Boolean(day));

  const durationMinutes = num(train.duration, 0);

  const asStation = (raw: Rec, fallback: Rec): Station => {
    const nested = isRec(raw.station) ? (raw.station as Rec) : raw;
    const code = String(nested.code ?? fallback.code ?? '').toUpperCase();
    return {
      code,
      name: strOrNull(nested.name) ?? strOrNull(fallback.name) ?? code,
      lat: num(nested.lat, num(fallback.lat, 0)),
      lng: num(nested.lng, num(fallback.lng, 0)),
    };
  };

  return {
    id: number,
    number,
    name,
    source: asStation(source, source),
    destination: asStation(destination, destination),
    type: mapTrainType(train.type, name),
    days: days.length > 0 ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime:
      strOrNull(first.departure) ?? istClock(first.scheduledDeparture) ?? '--:--',
    arrivalTime:
      strOrNull(last.arrival) ?? istClock(last.scheduledArrival) ?? '--:--',
    duration: durationMinutes > 0 ? formatMinutes(durationMinutes) : '--',
    totalDistance: Math.round(num(train.distance, 0) * 10) / 10,
    numberOfStops: num(
      train.totalHalts,
      points.filter((point) => point.isHalt === true).length
    ),
  };
}
