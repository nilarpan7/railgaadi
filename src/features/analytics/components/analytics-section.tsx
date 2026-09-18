'use client';

import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Route, Gauge, MapPin, Activity } from 'lucide-react';
import { formatDistance, formatSpeed, formatDelay } from '@/lib/utils';
import type { LiveStatus } from '@/types/train';

interface AnalyticsSectionProps {
  status: LiveStatus;
}

const statConfigs = [
  { key: 'total', label: 'Total Distance', icon: Route, format: (s: LiveStatus) => formatDistance(s.totalDistance) },
  { key: 'covered', label: 'Covered', icon: TrendingUp, format: (s: LiveStatus) => formatDistance(s.distanceCovered) },
  { key: 'remaining', label: 'Remaining', icon: MapPin, format: (s: LiveStatus) => formatDistance(s.distanceRemaining) },
  { key: 'speed', label: 'Current Speed', icon: Gauge, format: (s: LiveStatus) => formatSpeed(s.speed) },
  { key: 'stops', label: 'Stops', icon: BarChart3, format: (s: LiveStatus) => {
    const visited = s.stationStatuses.filter(st => st.status === 'visited').length;
    return `${visited} / ${s.stationStatuses.length}`;
  }},
  { key: 'eta', label: 'Final ETA', icon: Clock, format: (s: LiveStatus) => {
    try {
      return new Date(s.eta).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      });
    } catch { return '--:--'; }
  }},
];

export function AnalyticsSection({ status }: AnalyticsSectionProps) {
  // Delay chart data
  const delayData = status.stationStatuses
    .filter(s => s.status !== 'upcoming')
    .map(s => ({
      station: s.station.code,
      name: s.station.name,
      delay: s.delay,
    }));

  const maxDelay = Math.max(...delayData.map(x => Math.abs(x.delay)), 10);

  return (
    <div className="card-premium rounded-3xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Journey Analytics & Delay Trend
        </h3>
        <span className="text-xs font-semibold text-text-muted">
          Live Speed: {Math.round(status.speed)} km/h
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {statConfigs.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-surface p-3 text-center hover:border-accent/30 transition-colors"
            >
              <Icon className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-base font-extrabold text-text-primary tabular-nums">
                {stat.format(status)}
              </p>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Delay Trend Visualization */}
      {delayData.length > 1 ? (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Station-by-station delay (minutes)</span>
            <span>Max: {maxDelay} min</span>
          </div>

          <div className="flex items-end gap-1.5 h-28 pt-4 pb-1">
            {delayData.map((d, i) => {
              const height = (Math.abs(d.delay) / maxDelay) * 100;
              const isDelayed = d.delay > 0;
              const isSevere = d.delay > 15;

              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                  {/* Tooltip */}
                  <span className="pointer-events-none absolute -top-10 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-text-primary text-text-inverse text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap">
                    {d.name}: {formatDelay(d.delay)}
                  </span>

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 8)}%` }}
                    transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full rounded-t-lg min-h-[6px] transition-all group-hover:brightness-110 ${
                      isDelayed
                        ? isSevere
                          ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                          : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                    }`}
                  />
                  <span className="text-[9px] font-mono font-bold text-text-muted truncate w-full text-center">
                    {d.station}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-text-muted">
          Delay trend will populate as train passes upcoming stations.
        </div>
      )}
    </div>
  );
}
