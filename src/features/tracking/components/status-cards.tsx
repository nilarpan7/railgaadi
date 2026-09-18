'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Clock,
  Gauge,
  Route,
  Activity,
  Sparkles,
} from 'lucide-react';
import {
  cn,
  formatDelay,
  formatDistance,
  formatSpeed,
  getDelayColor,
} from '@/lib/utils';
import type { LiveStatus } from '@/types/train';
import { SpotlightCard } from '@/components/ui';

interface StatusCardsProps {
  status: LiveStatus;
}

const cards = [
  { key: 'current', label: 'Current Station', icon: MapPin, tone: 'accent' },
  { key: 'next', label: 'Next Stop', icon: Navigation, tone: 'teal' },
  { key: 'delay', label: 'Delay Status', icon: Clock, tone: 'warning' },
  { key: 'speed', label: 'Speed', icon: Gauge, tone: 'info' },
  { key: 'distance', label: 'Distance Covered', icon: Route, tone: 'success' },
  { key: 'progress', label: 'Journey Done', icon: Activity, tone: 'accent' },
] as const;

export function StatusCards({ status }: StatusCardsProps) {
  const nextStop = status.stationStatuses.find(
    (entry) => entry.station.code === status.nextStation.code
  );
  const distanceToNext =
    nextStop && nextStop.distanceFromSource > status.distanceCovered
      ? Math.round((nextStop.distanceFromSource - status.distanceCovered) * 10) / 10
      : status.distanceRemaining;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <SpotlightCard className="h-full p-4 flex flex-col justify-between">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <card.icon className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider truncate">
                  {card.label}
                </span>
              </div>
            </div>

            {/* Card Body */}
            {card.key === 'current' && (
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-extrabold text-text-primary truncate">
                  {status.currentStation.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[11px] font-bold text-accent">
                    {status.currentStation.code}
                  </span>
                  {status.currentPlatform && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-surface-alt font-semibold text-text-secondary">
                      PF {status.currentPlatform}
                    </span>
                  )}
                </div>
              </div>
            )}

            {card.key === 'next' && (
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-extrabold text-text-primary truncate">
                  {status.nextStation.name}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5 truncate font-medium">
                  {formatDistance(distanceToNext)}
                  {nextStop?.platform ? ` · PF ${nextStop.platform}` : ''}
                </p>
              </div>
            )}

            {card.key === 'delay' && (
              <div>
                <p className={cn('text-lg sm:text-xl font-extrabold tabular-nums', getDelayColor(status.delay))}>
                  {formatDelay(status.delay)}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 font-medium">
                  {status.delay <= 0 ? 'Ahead of time' : 'Running late'}
                </p>
              </div>
            )}

            {card.key === 'speed' && (
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-text-primary tabular-nums">
                  {formatSpeed(status.speed)}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 font-medium">
                  Live GPS Speed
                </p>
              </div>
            )}

            {card.key === 'distance' && (
              <div>
                <p className="text-sm sm:text-base font-extrabold text-text-primary tabular-nums">
                  {formatDistance(status.distanceCovered)}
                </p>
                <div className="mt-2 w-full h-1.5 rounded-full bg-surface-alt overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${status.progress}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full accent-gradient"
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-1 tabular-nums">
                  of {formatDistance(status.totalDistance)}
                </p>
              </div>
            )}

            {card.key === 'progress' && (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-lg sm:text-xl font-extrabold text-text-primary tabular-nums">
                    {Math.round(status.progress)}%
                  </p>
                  <p className="text-[10px] text-text-muted font-medium">
                    Journey finished
                  </p>
                </div>

                {/* Donut progress ring */}
                <div className="relative w-10 h-10 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      className="stroke-surface-alt"
                      strokeWidth="3.5"
                    />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      className="stroke-accent"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="100"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - status.progress }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-text-primary">
                    <Sparkles className="w-3 h-3 text-accent" />
                  </span>
                </div>
              </div>
            )}
          </SpotlightCard>
        </motion.div>
      ))}
    </div>
  );
}
