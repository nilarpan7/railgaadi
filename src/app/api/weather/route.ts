import { NextRequest } from 'next/server';
import { upstreamFetch } from '@/lib/upstream';
import { cache } from '@/lib/cache';
import { ok, error, getRequestId, rateLimitRequest } from '@/lib/http';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/constants';

interface WeatherPayload {
  stationName: string;
  stationCode: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  clouds: number;
  rainChance: number;
  description: string;
  icon: string;
  main: string;
  sunrise: string;
  sunset: string;
  updatedAt: string;
  provider: string;
}

const PLACEHOLDER_KEY = 'YOUR_OPENWEATHER_KEY_HERE';

interface OwmResponse {
  main?: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind?: { speed: number; deg: number };
  clouds?: { all: number };
  rain?: Record<string, unknown>;
  visibility?: number;
  weather?: Array<{ description: string; icon: string; main: string }>;
  sys?: { sunrise: number; sunset: number };
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    surface_pressure?: number;
    cloud_cover?: number;
    precipitation?: number;
    visibility?: number;
    weather_code?: number;
  };
  daily?: { sunrise?: string[]; sunset?: string[] };
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const lat = request.nextUrl.searchParams.get('lat');
  const lng = request.nextUrl.searchParams.get('lng');
  const stationName = request.nextUrl.searchParams.get('name') || 'Station';
  const stationCode = request.nextUrl.searchParams.get('code') || '';
  const log = logger.child({ route: 'weather', requestId, stationCode });

  const latF = Number(lat);
  const lngF = Number(lng);

  if (!Number.isFinite(latF) || !Number.isFinite(lngF) || Math.abs(latF) > 90 || Math.abs(lngF) > 180) {
    return error(400, 'INVALID_COORDINATES', 'valid lat and lng are required', { requestId });
  }

  const limited = await rateLimitRequest(request, { limit: 120, windowMs: 60_000 }, 'weather');
  if (!limited.allowed) {
    log.warn('rate limited');
    return error(429, 'RATE_LIMITED', 'Too many requests', {
      retryAfter: limited.retryAfterSec,
      requestId,
    });
  }

  // The station code is part of the key because the response embeds the station
  // label — two nearby stations rounding to the same coords would otherwise get
  // each other's name. The provider origin is also part of the key: a user with
  // an OpenWeatherMap key gets an OWM payload, a keyless user gets Open-Meteo,
  // and the two differ in provider, icon, description and rain-chance heuristics
  // — they must not share a cache entry.
  const userApiKey = request.headers.get('x-openweather-key') || process.env.OPENWEATHER_API_KEY;
  const providerOrigin = userApiKey && userApiKey !== PLACEHOLDER_KEY ? 'owm' : 'meteo';
  const cacheKey = `weather:${latF.toFixed(2)}:${lngF.toFixed(2)}:${stationCode}:${providerOrigin}`;

  // Throwing here signals "all upstreams failed" — the cache (memory or Redis)
  // deliberately does NOT cache a rejected fetch, so a recovered upstream is
  // picked up on the next request instead of serving a stale empty payload.
  class WeatherUnavailableError extends Error {
    constructor() {
      super('weather upstreams unavailable');
      this.name = 'WeatherUnavailableError';
    }
  }

  try {
    const data = await cache.getOrFetch(
      cacheKey,
      CACHE.WEATHER,
      async (): Promise<WeatherPayload> => {
        // 1. Try OpenWeatherMap if a real key is available.
        if (userApiKey && userApiKey !== PLACEHOLDER_KEY) {
          const owm = await upstreamFetch<OwmResponse>(
            'openweather',
            `https://api.openweathermap.org/data/2.5/weather?lat=${latF}&lon=${lngF}&appid=${encodeURIComponent(userApiKey)}&units=metric`,
            { timeoutMs: 5000, idempotent: true, retries: 1 }
          );

          const o = owm.data;
          if (o?.main) {
            return {
              stationName,
              stationCode,
              temperature: Math.round(o.main.temp),
              feelsLike: Math.round(o.main.feels_like),
              humidity: o.main.humidity,
              windSpeed: o.wind?.speed ?? 0,
              windDirection: o.wind?.deg ?? 0,
              pressure: o.main.pressure,
              visibility: o.visibility ?? 10000,
              clouds: o.clouds?.all ?? 0,
              rainChance: o.rain ? 80 : (o.clouds?.all ?? 0) > 70 ? 40 : 10,
              description: o.weather?.[0]?.description ?? 'Unknown',
              icon: o.weather?.[0]?.icon ?? '01d',
              main: o.weather?.[0]?.main ?? 'Unknown',
              sunrise: new Date((o.sys?.sunrise ?? Date.now() / 1000) * 1000).toISOString(),
              sunset: new Date((o.sys?.sunset ?? Date.now() / 1000) * 1000).toISOString(),
              updatedAt: new Date().toISOString(),
              provider: 'OpenWeatherMap',
            };
          }
          log.warn('openweathermap unavailable', { error: owm.error });
        }

        // 2. Open-Meteo — free, no key required.
        const om = await upstreamFetch<OpenMeteoResponse>(
          'open-meteo',
          `https://api.open-meteo.com/v1/forecast?latitude=${latF}&longitude=${lngF}` +
            '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,' +
            'wind_direction_10m,surface_pressure,cloud_cover,precipitation,visibility,weather_code' +
            '&daily=sunrise,sunset&timezone=auto',
          { timeoutMs: 6000, idempotent: true, retries: 1 }
        );

        const data = om.ok ? om.data : undefined;
        const current = data?.current;
        if (current) {
          const codeMap: Record<number, { desc: string; icon: string; main: string }> = {
            0: { desc: 'Clear sky', icon: '01d', main: 'Clear' },
            1: { desc: 'Mainly clear', icon: '01d', main: 'Clear' },
            2: { desc: 'Partly cloudy', icon: '02d', main: 'Clouds' },
            3: { desc: 'Overcast', icon: '04d', main: 'Clouds' },
            45: { desc: 'Foggy', icon: '50d', main: 'Fog' },
            48: { desc: 'Rime fog', icon: '50d', main: 'Fog' },
            51: { desc: 'Light drizzle', icon: '09d', main: 'Rain' },
            61: { desc: 'Slight rain', icon: '10d', main: 'Rain' },
            63: { desc: 'Moderate rain', icon: '10d', main: 'Rain' },
            65: { desc: 'Heavy rain', icon: '10d', main: 'Rain' },
            80: { desc: 'Rain showers', icon: '09d', main: 'Rain' },
            95: { desc: 'Thunderstorm', icon: '11d', main: 'Thunderstorm' },
          };
          const code = current.weather_code !== undefined ? codeMap[current.weather_code] : undefined;
          const info = code || { desc: 'Partly cloudy', icon: '02d', main: 'Clouds' };
          const daily = data.daily ?? {};

          const isoOrNow = (value: unknown): string => {
            const parsed = typeof value === 'string' ? new Date(value) : null;
            return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
          };

          return {
            stationName,
            stationCode,
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
            humidity: Math.round(current.relative_humidity_2m ?? 0),
            windSpeed: Math.round(((current.wind_speed_10m ?? 0) / 3.6) * 10) / 10,
            windDirection: Math.round(current.wind_direction_10m ?? 0),
            pressure: Math.round(current.surface_pressure ?? 0),
            visibility: Math.round(current.visibility ?? 10000),
            clouds: current.cloud_cover ?? 0,
            rainChance:
              (current.precipitation ?? 0) > 0 ? 85 : (current.cloud_cover ?? 0) > 60 ? 40 : 10,
            description: info.desc,
            icon: info.icon,
            main: info.main,
            sunrise: isoOrNow(daily.sunrise?.[0]),
            sunset: isoOrNow(daily.sunset?.[0]),
            updatedAt: new Date().toISOString(),
            provider: 'Open-Meteo',
          };
        }

        log.warn('weather upstreams unavailable', { openMeteoError: om.error });
        throw new WeatherUnavailableError();
      }
    );

    return ok(data, {
      cacheControl: { maxAge: 600, sMaxAge: 1800 },
      requestId,
    });
  } catch (caught) {
    if (caught instanceof WeatherUnavailableError) {
      return error(503, 'WEATHER_UNAVAILABLE', 'Weather unavailable', {
        retryable: true,
        requestId,
      });
    }
    throw caught;
  }
}
