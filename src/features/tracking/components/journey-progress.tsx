'use client';

import { motion } from 'framer-motion';
import { Train, Check, Sparkles } from 'lucide-react';
import type { LiveStatus } from '@/types/train';

interface JourneyProgressProps {
  status: LiveStatus;
}

export function JourneyProgress({ status }: JourneyProgressProps) {
  const stations = status.stationStatuses;
  if (!stations || stations.length === 0) return null;

  const total =
    status.totalDistance > 0
      ? status.totalDistance
      : stations[stations.length - 1]?.distanceFromSource || 0;

  return (
    <div className="card-premium rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-display text-sm font-bold text-text-primary">
            Journey Milestone Tracker
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-accent bg-accent-light px-2.5 py-1 rounded-xl">
          {Math.round(status.progress)}% Complete
        </span>
      </div>

      <div className="relative pt-6 pb-8 sm:pb-10">
        {/* Track Line Background */}
        <div className="relative h-2.5 rounded-full bg-surface-alt overflow-hidden border border-border/50">
          {/* Completed Glowing Track */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${status.progress}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 left-0 rounded-full accent-gradient shadow-[0_0_12px_var(--accent-glow)]"
          />
        </div>

        {/* Station Dots along the line */}
        <div className="relative h-2">
          {stations.map((s) => {
            const position =
              total > 0
                ? Math.min(100, Math.max(0, (s.distanceFromSource / total) * 100))
                : 0;
            const isVisited = s.status === 'visited';
            const isCurrent = s.status === 'current';

            return (
              <div
                key={s.station.code}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2 group cursor-pointer z-10"
                style={{ left: `${position}%` }}
              >
                {/* Station dot indicator */}
                <div
                  className={`w-3.5 h-3.5 -mt-3.5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                    isCurrent
                      ? 'border-white bg-accent ring-4 ring-accent/30 scale-125 shadow-lg'
                      : isVisited
                        ? 'border-white bg-accent shadow-xs'
                        : 'border-border bg-surface hover:border-accent/60'
                  }`}
                >
                  {isVisited && (
                    <Check className="w-2 h-2 text-white stroke-[3]" />
                  )}
                </div>

                {/* Station Code label */}
                <span
                  className={`mt-2 font-mono text-[10px] whitespace-nowrap transition-colors select-none ${
                    isCurrent
                      ? 'text-accent font-extrabold scale-105'
                      : isVisited
                        ? 'text-text-primary font-semibold'
                        : 'text-text-muted group-hover:text-text-secondary'
                  }`}
                >
                  {s.station.code}
                </span>

                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute -top-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-text-primary text-text-inverse text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap">
                  {s.station.name} {s.platform ? `(PF ${s.platform})` : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Moving Train Icon at exact progress */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${status.progress}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 -translate-x-1/2 -mt-4 pointer-events-none z-20"
        >
          <div className="w-8 h-8 rounded-2xl bg-accent flex items-center justify-center text-white shadow-[0_4px_16px_var(--accent-glow)] border-2 border-white ring-2 ring-accent/30">
            <Train className="w-4 h-4 animate-pulse" />
          </div>
        </motion.div>
      </div>

      {/* Endpoints Footer */}
      <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border-light pt-3">
        <span className="font-semibold text-text-primary">
          {stations[0]?.station.name} ({stations[0]?.station.code})
        </span>
        <span className="font-semibold text-text-primary">
          {stations[stations.length - 1]?.station.name} ({stations[stations.length - 1]?.station.code})
        </span>
      </div>
    </div>
  );
}
