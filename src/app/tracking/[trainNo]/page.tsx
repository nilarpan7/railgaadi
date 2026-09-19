'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { ErrorState } from '@/components/shared/error-state';
import { TrainHeader } from '@/features/tracking/components/train-header';
import { StatusCards } from '@/features/tracking/components/status-cards';
import { JourneyProgress } from '@/features/tracking/components/journey-progress';
import { StationTimeline } from '@/features/tracking/components/station-timeline';
import { WeatherSection } from '@/features/weather/components/weather-section';
import { NearbySection } from '@/features/nearby/components/nearby-section';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogIn, Sparkles } from 'lucide-react';
import { useTracking } from '@/features/tracking/hooks/useTracking';
import { useRoute } from '@/features/tracking/hooks/useRoute';
import {
  AuroraBackground,
  GridPattern,
  NoiseOverlay,
  ScrollProgress,
} from '@/components/ui';

const JourneyMap = dynamic(
  () =>
    import('@/features/map/components/journey-map').then(
      (mod) => mod.JourneyMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] sm:h-[420px] rounded-3xl bg-surface-sunken flex flex-col items-center justify-center border border-border shadow-md">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent mb-3" />
        <p className="text-xs font-bold text-text-secondary">
          Initializing telemetry map…
        </p>
      </div>
    ),
  }
);

const AnalyticsSection = dynamic(
  () =>
    import('@/features/analytics/components/analytics-section').then(
      (mod) => mod.AnalyticsSection
    ),
  {
    ssr: false,
    loading: () => (
      <div className="skeleton h-[280px] sm:h-[320px] rounded-3xl" />
    ),
  }
);

export default function TrackingPage({
  params,
}: {
  params: Promise<{ trainNo: string }>;
}) {
  const { trainNo } = use(params);
  const { data: session } = useSession();
  const { data: status, isLoading, error, refetch } = useTracking(trainNo);
  const { data: route } = useRoute(trainNo);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative">
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 relative overflow-hidden pb-28 md:pb-12">
        {/* Subtle Ambient Aurora Light & Grid */}
        <AuroraBackground intensity={0.4} className="pointer-events-none" />
        <GridPattern className="opacity-[0.35] pointer-events-none" />
        <NoiseOverlay />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
          {/* Guest Banner */}
          {!session?.user && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left border-accent/30 bg-accent-light/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_var(--accent-glow)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">
                    Live Demo Mode Active
                  </p>
                  <p className="text-[11px] text-text-secondary font-medium">
                    Sign in with 1-click Demo Account to save journeys, pin favorite trains, and sync alerts.
                  </p>
                </div>
              </div>
              <Link
                href={`/login?callbackUrl=/tracking/${trainNo}`}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Instant Sign In</span>
              </Link>
            </motion.div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-4 animate-fade-in">
              <div className="skeleton h-24 rounded-3xl" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-28 rounded-2xl" />
                ))}
              </div>
              <div className="skeleton h-[360px] sm:h-[420px] rounded-3xl" />
            </div>
          )}

          {/* Error State */}
          {error && !status && (
            <div className="card-premium rounded-3xl p-8 text-center my-12">
              <ErrorState
                title="Train telemetry unavailable"
                message={
                  error instanceof Error
                    ? error.message
                    : `Could not retrieve live tracking data for train #${trainNo}. Please verify the train number or try searching again.`
                }
                onRetry={() => refetch()}
              />
            </div>
          )}

          {/* Live Tracking Content */}
          {status && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              {/* Train Header Console */}
              <TrainHeader status={status} />

              {/* Status KPI Cards */}
              <StatusCards status={status} />

              {/* Live Journey Map (Horizontal Arrow View) */}
              <JourneyMap status={status} route={route || null} />

              {/* Journey Milestone Progress */}
              <JourneyProgress status={status} />

              {/* Two Column Layout: Station Timeline & Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <StationTimeline stations={status.stationStatuses} />
                <AnalyticsSection status={status} />
              </div>

              {/* Live Weather Section */}
              <WeatherSection status={status} />

              {/* Smart Travel Companion — Nearby Landmarks */}
              <NearbySection status={status} />
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
