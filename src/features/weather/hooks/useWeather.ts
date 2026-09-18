'use client';

import { useQueries } from '@tanstack/react-query';
import { CACHE } from '@/lib/constants';
import type { WeatherData } from '@/types/weather';
import type { Station } from '@/types/train';

export function useWeather(stations: { station: Station; context: string }[]) {
  return useQueries({
    queries: stations.map(({ station }) => ({
      queryKey: ['weather', station.code],
      queryFn: async (): Promise<WeatherData> => {
        const response = await fetch(
          `/api/weather?lat=${station.lat}&lng=${station.lng}&name=${encodeURIComponent(station.name)}&code=${station.code}`
        );
        if (!response.ok) throw new Error('Weather fetch failed');
        return response.json();
      },
      staleTime: CACHE.WEATHER,
      enabled: !!station.lat && !!station.lng,
    })),
  });
}
