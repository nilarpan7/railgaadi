'use client';

import { motion } from 'framer-motion';
import { Cloud, Droplets, Wind } from 'lucide-react';
import { getWeatherEmoji } from '@/lib/utils';
import { useWeather } from '../hooks/useWeather';
import type { LiveStatus } from '@/types/train';
import { SpotlightCard } from '@/components/ui';

interface WeatherSectionProps {
  status: LiveStatus;
}

export function WeatherSection({ status }: WeatherSectionProps) {
  const stations = [
    { station: status.currentStation, context: 'Current Station' },
    { station: status.nextStation, context: 'Next Stop' },
    { station: status.lastStation, context: 'Final Destination' },
  ];

  const weatherQueries = useWeather(stations);

  return (
    <div className="card-premium rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
          <Cloud className="w-4 h-4 text-accent" />
          Live Weather Along Route
        </h3>
        <span className="text-xs font-semibold text-text-muted">
          Real-time Open-Meteo Feed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stations.map((s, i) => {
          const query = weatherQueries[i];
          const weather = query?.data;
          const isLoading = query?.isLoading;

          return (
            <motion.div
              key={s.station.code + s.context}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <SpotlightCard className="h-full p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-accent bg-accent-light px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {s.context}
                    </span>
                    <span className="font-mono text-xs font-bold text-text-muted">
                      {s.station.code}
                    </span>
                  </div>

                  {isLoading ? (
                    <div className="space-y-2 py-2">
                      <div className="skeleton h-8 w-24 rounded-lg" />
                      <div className="skeleton h-4 w-32 rounded-md" />
                    </div>
                  ) : weather ? (
                    <>
                      <div className="flex items-center justify-between my-2">
                        <div>
                          <p className="text-sm font-bold text-text-primary truncate max-w-[140px]">
                            {s.station.name}
                          </p>
                          <p className="text-2xl font-black text-text-primary mt-0.5 tabular-nums">
                            {weather.temperature}°C
                          </p>
                        </div>
                        <span className="text-3xl drop-shadow-sm">
                          {getWeatherEmoji(weather.icon)}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-text-secondary capitalize mb-3">
                        {weather.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-center border-t border-border-light pt-2.5">
                        <div>
                          <Droplets className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                          <p className="text-xs font-bold text-text-primary">{weather.humidity}%</p>
                          <p className="text-[9px] text-text-muted font-medium">Humidity</p>
                        </div>
                        <div>
                          <Wind className="w-3.5 h-3.5 text-teal-500 mx-auto mb-0.5" />
                          <p className="text-xs font-bold text-text-primary">{weather.windSpeed} m/s</p>
                          <p className="text-[9px] text-text-muted font-medium">Wind</p>
                        </div>
                        <div>
                          <Cloud className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-0.5" />
                          <p className="text-xs font-bold text-text-primary">{weather.rainChance}%</p>
                          <p className="text-[9px] text-text-muted font-medium">Rain</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-text-muted py-4">Weather telemetry syncing…</p>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
