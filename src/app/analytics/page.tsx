'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock,
  Gauge,
  Route as RouteIcon,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { cn, formatDelay, formatDistance, getDelayColor } from '@/lib/utils';
import {
  AnimatedCounter,
  AuroraBackground,
  Badge,
  Button,
  ButtonLink,
  Eyebrow,
  GridPattern,
  RevealGroup,
  RevealItem,
  ScrollProgress,
  SectionHeading,
  SpotlightCard,
} from '@/components/ui';
import { SPRING } from '@/lib/motion';
import { TRAINS } from '@/services/catalog';
import { useQueries } from '@tanstack/react-query';
import { getLiveStatus } from '@/services/api';
import { CACHE } from '@/lib/constants';

const NETWORK = TRAINS.slice(0, 8);

export default function AnalyticsPage() {
  const [activeNumber, setActiveNumber] = useState(NETWORK[0]?.number ?? '12951');

  const queries = useQueries({
    queries: NETWORK.map((train) => ({
      queryKey: ['tracking', train.number],
      queryFn: () => getLiveStatus(train.number),
      staleTime: CACHE.LIVE_STATUS,
    })),
  });

  const fleet = useMemo(() => {
    return NETWORK.map((train, i) => {
      const { data: status } = queries[i];
      return { train, status };
    }).filter((f): f is { train: typeof f.train; status: NonNullable<typeof f.status> } => !!f.status);
  }, [queries]);

  const active = fleet.find((f) => f.train.number === activeNumber) ?? fleet[0];

  const aggregate = useMemo(() => {
    const count = fleet.length || 1;
    const totalKm = fleet.reduce((sum, f) => sum + (f.status?.totalDistance || 0), 0);
    const coveredKm = fleet.reduce((sum, f) => sum + (f.status?.distanceCovered || 0), 0);
    const avgDelay = fleet.reduce((sum, f) => sum + (f.status?.delay || 0), 0) / count;
    const avgSpeed = fleet.reduce((sum, f) => sum + (f.status?.speed || 0), 0) / count;
    const onTime = fleet.filter((f) => (f.status?.delay || 0) <= 5).length;
    return {
      totalKm,
      coveredKm,
      avgDelay,
      avgSpeed,
      onTime,
      onTimeRate: (onTime / count) * 100,
    };
  }, [fleet]);

  if (!active) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="skeleton h-32 w-32 rounded-full" />
        </main>
      </div>
    );
  }

  const delaySeries = active.status.stationStatuses.filter(
    (s) => s.status !== 'upcoming'
  );
  const worstDelay = Math.max(
    ...delaySeries.map((s) => Math.abs(s.delay)),
    5
  );

  const punctuality = [...fleet]
    .sort((a, b) => a.status.delay - b.status.delay)
    .slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pb-28 md:pb-12">
        {/* ------------------------------------------------------------ hero */}
        <section className="relative overflow-hidden border-b border-border/60 px-4 pt-12 pb-14 sm:px-6 lg:px-8">
          <AuroraBackground intensity={0.7} />
          <GridPattern className="opacity-[0.5]" />

          <div className="relative mx-auto max-w-3xl text-center">
            <Eyebrow icon={<BarChart3 className="h-3 w-3" />}>
              Network intelligence
            </Eyebrow>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display mt-4 text-3xl font-extrabold tracking-tight text-balance text-text-primary sm:text-[2.75rem] sm:leading-[1.05]"
            >
              Every kilometre, <span className="text-gradient">measured</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base"
            >
              Punctuality, speed profiles and delay accumulation across the services
              you follow — rebuilt from the same live feed that powers the map.
            </motion.p>
          </div>

          {/* KPI strip */}
          <div className="relative mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              icon={<Trophy className="h-4 w-4" />}
              label="On-time rate"
              value={aggregate.onTimeRate}
              decimals={0}
              suffix="%"
            />
            <Kpi
              icon={<Clock className="h-4 w-4" />}
              label="Avg delay"
              value={Math.abs(aggregate.avgDelay)}
              decimals={0}
              suffix=" min"
            />
            <Kpi
              icon={<Gauge className="h-4 w-4" />}
              label="Avg speed"
              value={aggregate.avgSpeed}
              decimals={0}
              suffix=" km/h"
            />
            <Kpi
              icon={<RouteIcon className="h-4 w-4" />}
              label="Tracked distance"
              value={aggregate.coveredKm}
              decimals={0}
              suffix=" km"
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
          {/* ------------------------------------------------- delay profile */}
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Delay profile"
              eyebrowIcon={<Activity className="h-3 w-3" />}
              title="Where the minutes go"
              description="Station-by-station delay accumulation for the selected service. Green bars are gains, amber is drift, red is a hard slip."
              align="left"
              className="max-w-2xl"
            />

            {/* Train selector */}
            <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
              {fleet.map(({ train }) => {
                const isActive = train.number === activeNumber;
                return (
                  <Button
                    key={train.number}
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setActiveNumber(train.number)}
                    aria-pressed={isActive}
                    className={cn(
                      'relative shrink-0 rounded-full px-3.5 text-xs font-bold whitespace-nowrap',
                      isActive
                        ? 'text-white hover:text-white'
                        : 'border border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-text-primary'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="analyticsTrainPill"
                        transition={SPRING.soft}
                        className="accent-gradient absolute inset-0 rounded-full shadow-[0_6px_18px_var(--accent-glow)]"
                      />
                    )}
                    <span className="relative">
                      {train.number} · {train.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
              {/* Bar chart */}
              <div className="card-premium p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {active.train.name}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      #{active.train.number} · {active.train.source.code} →{' '}
                      {active.train.destination.code}
                    </p>
                  </div>
                  <Badge
                    tone={
                      active.status.delay > 15
                        ? 'error'
                        : active.status.delay > 5
                          ? 'warning'
                          : 'success'
                    }
                    dot
                  >
                    {formatDelay(active.status.delay)}
                  </Badge>
                </div>

                {delaySeries.length > 1 ? (
                  <div className="overflow-x-auto pb-2 scrollbar-thin">
                    <div className="flex h-48 items-end gap-1.5 min-w-[320px] sm:min-w-full pt-6">
                      {delaySeries.map((station, index) => {
                        const height = Math.max(
                          (Math.abs(station.delay) / worstDelay) * 100,
                          8
                        );
                        const tone =
                          station.delay > 15
                            ? 'from-red-500 to-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                            : station.delay > 5
                              ? 'from-amber-500 to-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                              : 'from-green-500 to-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.3)]';
                        return (
                          <div
                            key={`${station.station.code}-${index}`}
                            className="group relative flex flex-1 flex-col items-center justify-end gap-1.5 min-w-[28px]"
                          >
                            <span className="pointer-events-none absolute -top-2 z-20 -translate-y-full rounded-xl border border-border bg-text-primary text-text-inverse px-2.5 py-1 text-[10px] font-bold whitespace-nowrap opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                              {station.station.name} · {formatDelay(station.delay)}
                            </span>
                            <motion.span
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: `${height}%`, opacity: 1 }}
                              transition={{
                                delay: index * 0.03,
                                duration: 0.55,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className={cn(
                                'w-full min-h-[6px] rounded-t-lg bg-gradient-to-t transition-all group-hover:brightness-110',
                                tone
                              )}
                            />
                            <span className="w-full truncate text-center font-mono text-[9px] font-bold text-text-muted">
                              {station.station.code}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="py-16 text-center text-xs text-text-muted font-medium">
                    Not enough stations passed yet to plot a delay profile.
                  </p>
                )}
              </div>

              {/* Journey vitals */}
              <div className="card-premium flex flex-col gap-4 p-5 sm:p-6">
                <p className="text-xs font-bold tracking-wider text-text-muted uppercase">
                  Journey vitals
                </p>

                <ProgressRing progress={active.status.progress} />

                <div className="grid grid-cols-2 gap-3">
                  <Vital
                    label="Covered"
                    value={formatDistance(active.status.distanceCovered)}
                  />
                  <Vital
                    label="Remaining"
                    value={formatDistance(active.status.distanceRemaining)}
                  />
                  <Vital label="Speed" value={`${Math.round(active.status.speed)} km/h`} />
                  <Vital
                    label="Stops passed"
                    value={`${
                      active.status.stationStatuses.filter(
                        (s) => s.status === 'visited'
                      ).length
                    } / ${active.status.stationStatuses.length}`}
                  />
                </div>

                <ButtonLink
                  href={`/tracking/${active.train.number}`}
                  variant="primary"
                  size="sm"
                  shine
                  className="mt-auto w-full"
                >
                  Open live map
                  <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------- leaderboard */}
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Punctuality board"
              eyebrowIcon={<TrendingUp className="h-3 w-3" />}
              title="Most reliable right now"
              description="Ranked by current running delay across the services in the directory."
              align="left"
              className="max-w-2xl"
            />

            <RevealGroup
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              stagger={0.06}
            >
              {punctuality.map(({ train, status }, index) => (
                <RevealItem key={train.number}>
                  <SpotlightCard className="h-full p-0">
                    <Link
                      href={`/tracking/${train.number}`}
                      className="group flex h-full items-center gap-4 p-4"
                    >
                      <span
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold',
                          index === 0
                            ? 'accent-gradient text-white shadow-[0_6px_18px_var(--accent-glow)]'
                            : 'bg-surface-alt text-text-secondary'
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-text-primary transition-colors group-hover:text-accent">
                          {train.name}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          #{train.number} · {status.currentStation.code} →{' '}
                          {train.destination.code}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-xs font-bold',
                          getDelayColor(status.delay)
                        )}
                      >
                        {formatDelay(status.delay)}
                      </span>
                    </Link>
                  </SpotlightCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

/* ==============================================================
   Local pieces
   ============================================================== */

function Kpi({
  icon,
  label,
  value,
  decimals = 0,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.soft}
      className="card-premium p-4 text-center sm:p-5"
    >
      <span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-xl bg-accent-light text-accent">
        {icon}
      </span>
      <p className="font-display text-2xl font-extrabold text-text-primary tabular-nums sm:text-3xl">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-text-muted">{label}</p>
    </motion.div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-alt/60 p-3">
      <p className="text-[10px] font-medium tracking-wide text-text-muted uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative mx-auto grid h-32 w-32 place-items-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-border"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#ringGradient)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (clamped / 100) * circumference,
          }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-secondary, var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-extrabold text-text-primary tabular-nums">
          <AnimatedCounter value={clamped} decimals={0} suffix="%" />
        </p>
        <p className="text-[10px] text-text-muted">journey done</p>
      </div>
    </div>
  );
}
