'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Heart,
  Radio,
  FlaskConical,
  Check,
  Train,
  ArrowRight,
} from 'lucide-react';
import { cn, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { useFavoritesStore } from '@/store/favorites';
import type { LiveStatus } from '@/types/train';
import { SPRING } from '@/lib/motion';

interface TrainHeaderProps {
  status: LiveStatus;
}

export function TrainHeader({ status }: TrainHeaderProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const fav = isFavorite(status.trainNumber);
  const isDemo = status.dataSource === 'demo';
  const [copied, setCopied] = useState(false);

  const origin = status.stationStatuses?.[0]?.station ?? status.currentStation;

  const handleShare = async () => {
    const url = `${window.location.origin}/tracking/${status.trainNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${status.trainName} (#${status.trainNumber}) - Live Tracking`,
          text: `Track ${status.trainName} live on RailGaadi`,
          url,
        });
        return;
      } catch {
        // user cancelled or fallback
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.soft}
      className="card-premium relative overflow-hidden rounded-3xl p-5 sm:p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Train Identity & Route */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="accent-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-[0_6px_18px_var(--accent-glow)]">
              <Train className="h-5 w-5" />
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
              {status.trainName}
            </h1>

            <span className="font-mono text-xs font-bold text-accent bg-accent-light px-2.5 py-1 rounded-xl border border-accent/20 shadow-xs">
              #{status.trainNumber}
            </span>

            {isDemo && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                title="Live upstream is unavailable; showing simulated telemetry"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Demo Feed
              </span>
            )}
          </div>

          {/* Route path with animated arrow */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary font-medium pl-0.5">
            <span className="font-semibold text-text-primary">{origin.name}</span>
            <span className="text-text-muted">({origin.code})</span>
            <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="font-semibold text-text-primary">{status.lastStation?.name}</span>
            <span className="text-text-muted">({status.lastStation?.code})</span>
          </div>
        </div>

        {/* Right: Actions & Badges */}
        <div className="flex items-center flex-wrap gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-border-light">
          {/* Status Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold capitalize shadow-xs',
              getStatusColor(status.status)
            )}
          >
            {status.status === 'running' && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            )}
            {status.status.replace('-', ' ')}
          </span>

          {/* Updated time */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted bg-surface-alt px-3 py-1.5 rounded-full border border-border-light">
            <Radio className="w-3 h-3 text-accent animate-pulse" />
            <span>{formatRelativeTime(status.updatedAt)}</span>
          </span>

          {/* Favorite Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              toggleFavorite({
                trainNumber: status.trainNumber,
                trainName: status.trainName,
                source: origin.name,
                destination: status.lastStation?.name || '',
              })
            }
            className={cn(
              'p-2.5 rounded-2xl border transition-all duration-200 shadow-xs flex items-center justify-center',
              fav
                ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'border-border bg-surface hover:bg-surface-alt text-text-secondary hover:text-text-primary'
            )}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            title={fav ? 'Saved in favorites' : 'Save to favorites'}
          >
            <Heart className={cn('w-4 h-4 transition-transform', fav && 'fill-current scale-110')} />
          </motion.button>

          {/* Share Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="p-2.5 rounded-2xl border border-border bg-surface hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-all duration-200 shadow-xs relative flex items-center justify-center"
            aria-label="Share train status"
            title="Share or copy link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
