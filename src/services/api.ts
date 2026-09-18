import type { Train } from '@/types/train';
import type { LiveStatus } from '@/types/train';
import type { RouteData } from '@/types/route';
import type { WeatherData } from '@/types/weather';
import type { ElevationPoint } from '@/types/elevation';
import type { NearbyPlace } from '@/types/nearby';

const API_BASE = '/api';

// ============================================
// Generic Fetch Wrapper
// ============================================
async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  retries: number = 1
): Promise<T> {
  let lastError: Error | null = null;

  // Retrieve client API keys if stored
  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const rrKey = localStorage.getItem('rr_live_key');
    if (rrKey) customHeaders['x-railradar-key'] = rrKey;
    const mtKey = localStorage.getItem('maptiler_key');
    if (mtKey) customHeaders['x-maptiler-key'] = mtKey;
    const owmKey = localStorage.getItem('owm_key');
    if (owmKey) customHeaders['x-openweather-key'] = owmKey;
  }

  for (let attempt = 0; attempt < retries + 1; attempt++) {
    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const onCallerAbort = () => controller.abort();
      if (options.signal) {
        options.signal.addEventListener('abort', onCallerAbort, { once: true });
      }

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...customHeaders,
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } finally {
        clearTimeout(timeout);
        if (options.signal) {
          options.signal.removeEventListener('abort', onCallerAbort);
        }
      }
    } catch (error) {
      lastError = error as Error;
      if (options.signal?.aborted || (error as Error).name === 'AbortError') {
        throw error;
      }
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * 2 ** attempt, 3000))
        );
      }
    }
  }

  throw lastError || new Error('API request failed');
}

// ============================================
// Train Search
// ============================================
export async function searchTrains(query: string, signal?: AbortSignal): Promise<Train[]> {
  return apiFetch<Train[]>(`${API_BASE}/trains/search?q=${encodeURIComponent(query)}`, { signal }, 1);
}

// ============================================
// Live Tracking
// ============================================
export async function getLiveStatus(trainNo: string): Promise<LiveStatus> {
  return apiFetch<LiveStatus>(`${API_BASE}/trains/${trainNo}/live`);
}

// ============================================
// Route Data
// ============================================
export async function getRoute(trainNo: string): Promise<RouteData> {
  return apiFetch<RouteData>(`${API_BASE}/trains/${trainNo}/route`);
}

// ============================================
// Weather
// ============================================
export async function getWeather(lat: number, lng: number): Promise<WeatherData> {
  return apiFetch<WeatherData>(`${API_BASE}/weather?lat=${lat}&lng=${lng}`);
}

// ============================================
// Elevation Profile
// ============================================
export async function getElevation(
  coordinates: [number, number][]
): Promise<ElevationPoint[]> {
  return apiFetch<ElevationPoint[]>(`${API_BASE}/elevation`, {
    method: 'POST',
    body: JSON.stringify({ coordinates }),
  });
}

// ============================================
// Nearby Places
// ============================================
export async function getNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<NearbyPlace[]> {
  return apiFetch<NearbyPlace[]>(
    `${API_BASE}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
  );
}
