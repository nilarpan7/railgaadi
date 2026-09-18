'use client';

import { motion } from 'framer-motion';
import { Check, Circle, MapPin, Clock } from 'lucide-react';
import { cn, formatDelay, getDelayColor } from '@/lib/utils';
import type { StationStatus } from '@/types/train';

interface StationTimelineProps {
  stations: StationStatus[];
}

export function StationTimeline({ stations }: StationTimelineProps) {
  if (!stations || stations.length === 0) return null;

  return (
    <div className="card-premium rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          Station Timeline & Halts
        </h3>
        <span className="text-xs font-semibold text-text-muted">
          {stations.length} Scheduled Stops
        </span>
      </div>

      <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
        {stations.map((s, i) => {
          const isFirst = i === 0;
          const isLast = i === stations.length - 1;
          const isVisited = s.status === 'visited';
          const isCurrent = s.status === 'current';

          return (
            <motion.div
              key={s.station.code}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
              className="flex gap-3.5 group rounded-2xl p-2 hover:bg-surface-alt/50 transition-colors"
            >
              {/* Timeline Indicator Column */}
              <div className="flex flex-col items-center">
                {/* Connector Top */}
                {!isFirst && (
                  <div
                    className={cn(
                      'w-0.5 h-3.5 transition-colors',
                      isVisited || isCurrent ? 'bg-accent' : 'bg-border'
                    )}
                  />
                )}

                {/* Status Dot */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs',
                    isCurrent
                      ? 'bg-accent text-white shadow-[0_0_12px_var(--accent-glow)] ring-4 ring-accent/25 scale-110'
                      : isVisited
                        ? 'bg-accent text-white'
                        : 'bg-surface text-text-muted border-2 border-border'
                  )}
                >
                  {isVisited ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : isCurrent ? (
                    <MapPin className="w-3 h-3 animate-bounce" />
                  ) : (
                    <Circle className="w-2 h-2 text-text-muted" />
                  )}
                </div>

                {/* Connector Bottom */}
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 h-3.5 transition-colors flex-1 min-h-[14px]',
                      isVisited ? 'bg-accent' : 'bg-border'
                    )}
                  />
                )}
              </div>

              {/* Station Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'text-sm font-bold truncate transition-colors',
                        isCurrent
                          ? 'text-accent'
                          : isVisited
                            ? 'text-text-primary'
                            : 'text-text-secondary'
                      )}
                    >
                      {s.station.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-text-muted bg-surface-alt px-1.5 py-0.5 rounded-md">
                      {s.station.code}
                    </span>
                  </div>

                  {s.platform && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-alt text-text-secondary border border-border/50 shrink-0">
                      PF {s.platform}
                    </span>
                  )}
                </div>

                {/* Timing & Delay Grid */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
                  {s.scheduledArrival && (
                    <span className="text-text-secondary">
                      <span className="text-text-muted font-normal">Arr:</span>{' '}
                      <span className="font-semibold text-text-primary">{s.scheduledArrival}</span>
                    </span>
                  )}
                  {s.scheduledDeparture && (
                    <span className="text-text-secondary">
                      <span className="text-text-muted font-normal">Dep:</span>{' '}
                      <span className="font-semibold text-text-primary">{s.scheduledDeparture}</span>
                    </span>
                  )}
                  {(isVisited || isCurrent) && s.delay !== 0 && (
                    <span className={cn('font-bold', getDelayColor(s.delay))}>
                      {formatDelay(s.delay)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
