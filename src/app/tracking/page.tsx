'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, Heart, Radio, Route, Train } from 'lucide-react';
import { SearchBar } from '@/features/search/components/search-bar';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { TRAINS } from '@/services/mock-data';
import { useFavoritesStore } from '@/store/favorites';
import { useRecentSearchesStore } from '@/store/recent-searches';
import { cn, getTrainTypeColor } from '@/lib/utils';
import {
  AuroraBackground,
  Button,
  Eyebrow,
  GridPattern,
  RevealGroup,
  RevealItem,
  ScrollProgress,
  SectionHeading,
  SpotlightCard,
} from '@/components/ui';
import { SPRING } from '@/lib/motion';
import type { TrainType } from '@/types/train';

const TRAIN_TYPES: (TrainType | 'All')[] = [
  'All',
  'Rajdhani',
  'Shatabdi',
  'Vande Bharat',
  'Duronto',
  'SuperFast',
  'Express',
];

export default function TrackingIndexPage() {
  const [selectedType, setSelectedType] = useState<TrainType | 'All'>('All');
  const favorites = useFavoritesStore((state) => state.favorites);
  const searches = useRecentSearchesStore((state) => state.searches);
  const clearAllSearches = useRecentSearchesStore((state) => state.clearAll);

  const filteredTrains = useMemo(
    () =>
      TRAINS.filter((train) => selectedType === 'All' || train.type === selectedType),
    [selectedType]
  );

  const hasShortcuts = favorites.length > 0 || searches.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pb-28 md:pb-12">
        {/* ---------------------------------------------------------------
            Search hero
        --------------------------------------------------------------- */}
        <section className="relative z-30 border-b border-border/60 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AuroraBackground intensity={0.75} />
            <GridPattern className="opacity-[0.5]" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={SPRING.soft}
              className="accent-gradient mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl shadow-[0_14px_40px_var(--accent-glow)]"
            >
              <Train className="h-7 w-7 text-white" strokeWidth={2.4} />
            </motion.div>

            <Eyebrow icon={<Radio className="h-3 w-3" />}>Live tracking hub</Eyebrow>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-text-primary sm:text-[2.75rem] sm:leading-[1.05]"
            >
              Find your train.{' '}
              <span className="text-gradient">Watch it move.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base"
            >
              Search any Indian Railways service by number or name for real-time GPS
              position, delay history, station-by-station timing, weather along the
              route, and a live interactive map.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-7 max-w-2xl"
            >
              <SearchBar variant="hero" />
            </motion.div>

            <p className="mt-3 text-[11px] text-text-muted">
              Press{' '}
              <kbd className="rounded-md border border-border-light bg-surface-alt px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
                /
              </kbd>{' '}
              anywhere to jump back to search
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
          {/* -------------------------------------------------------------
              Saved trains + recent searches
          ------------------------------------------------------------- */}
          {hasShortcuts && (
            <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2" stagger={0.08}>
              {favorites.length > 0 && (
                <RevealItem>
                  <ShortcutPanel
                    title="Your saved trains"
                    icon={
                      <Heart className="h-3.5 w-3.5 fill-current text-accent" />
                    }
                    action={{ href: '/favorites', label: 'All saved' }}
                  >
                    {favorites.slice(0, 4).map((favorite) => (
                      <ShortcutRow
                        key={favorite.trainNumber}
                        href={`/tracking/${favorite.trainNumber}`}
                        primary={favorite.trainName}
                        secondary={`#${favorite.trainNumber}`}
                      />
                    ))}
                  </ShortcutPanel>
                </RevealItem>
              )}

              {searches.length > 0 && (
                <RevealItem>
                  <ShortcutPanel
                    title="Recent searches"
                    icon={<Clock className="h-3.5 w-3.5 text-text-muted" />}
                    actionButton={
                      <button
                        type="button"
                        onClick={clearAllSearches}
                        className="text-[11px] font-semibold text-text-muted hover:text-error transition-colors"
                      >
                        Clear all
                      </button>
                    }
                  >
                    {searches.slice(0, 4).map((search) => (
                      <ShortcutRow
                        key={`${search.query}-${search.trainNumber ?? 'q'}`}
                        href={
                          search.trainNumber
                            ? `/tracking/${search.trainNumber}`
                            : '/tracking'
                        }
                        primary={search.query}
                        secondary={
                          search.trainNumber ? `#${search.trainNumber}` : 'Search again'
                        }
                      />
                    ))}
                  </ShortcutPanel>
                </RevealItem>
              )}
            </RevealGroup>
          )}

          {/* -------------------------------------------------------------
              Directory
          ------------------------------------------------------------- */}
          <div className="space-y-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                eyebrow="Directory"
                eyebrowIcon={<Route className="h-3 w-3" />}
                title="Popular train directory"
                description="Pick a service to launch live GPS tracking, the interactive route map, and full journey analytics."
                align="left"
                className="max-w-xl"
              />

              <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
                {TRAIN_TYPES.map((type) => {
                  const active = selectedType === type;
                  return (
<Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setSelectedType(type)}
                    aria-pressed={active}
                    className={cn(
                      'relative shrink-0 rounded-full px-3.5 text-xs font-bold whitespace-nowrap',
                      active
                        ? 'text-white hover:text-white'
                        : 'border border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-text-primary'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="trainTypePill"
                        transition={SPRING.soft}
                        className="accent-gradient absolute inset-0 rounded-full shadow-[0_6px_18px_var(--accent-glow)]"
                      />
                    )}
                    <span className="relative">{type}</span>
                  </Button>
                  );
                })}
              </div>
            </div>

            <motion.div
              key={selectedType}
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredTrains.map((train) => (
                <motion.div
                  key={train.number}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                    },
                  }}
                >
                  <SpotlightCard className="h-full p-0">
                    <Link
                      href={`/tracking/${train.number}`}
                      className="group flex h-full flex-col p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-text-primary transition-colors group-hover:text-accent">
                            {train.name}
                          </h3>
                          <span className="font-mono text-xs text-text-muted">
                            #{train.number}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            getTrainTypeColor(train.type)
                          )}
                        >
                          {train.type}
                        </span>
                      </div>

                      {/* Route rail */}
                      <div className="my-5 flex items-center gap-2 text-xs">
                        <div className="text-right">
                          <p className="font-bold text-text-primary">
                            {train.source.code}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {train.departureTime}
                          </p>
                        </div>
                        <div className="relative flex flex-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          <span className="h-px flex-1 bg-gradient-to-r from-accent/60 via-border to-accent/60" />
                          <motion.span
                            aria-hidden
                            className="absolute left-0 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]"
                            animate={{ left: ['0%', '100%'] }}
                            transition={{
                              duration: 2.6,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              repeatDelay: 0.6,
                            }}
                          />
                          <ArrowRight className="h-3 w-3 shrink-0 text-text-muted transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">
                            {train.destination.code}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {train.arrivalTime}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-border-light pt-3 text-[11px] text-text-muted">
                        <span className="truncate">{train.source.name}</span>
                        <span className="shrink-0 font-semibold text-text-secondary">
                          {train.duration} · {train.totalDistance} km
                        </span>
                      </div>
                    </Link>
                  </SpotlightCard>
                </motion.div>
              ))}
            </motion.div>

            {filteredTrains.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-surface-alt/50 py-16 text-center">
                <p className="text-sm font-semibold text-text-primary">
                  No {selectedType} services in the directory yet
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Search by train number above — live tracking works for every train,
                  not just the ones listed here.
                </p>
              </div>
            )}
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

function ShortcutPanel({
  title,
  icon,
  action,
  actionButton,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: { href: string; label: string };
  actionButton?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card-premium h-full p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-text-primary uppercase">
          {icon}
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="text-[11px] font-semibold text-accent transition-opacity hover:opacity-70"
          >
            {action.label}
          </Link>
        )}
        {actionButton}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ShortcutRow({
  href,
  primary,
  secondary,
}: {
  href: string;
  primary: string;
  secondary: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl bg-surface-alt/60 p-3 transition-colors hover:bg-surface-hover"
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-text-primary transition-colors group-hover:text-accent">
          {primary}
        </p>
        <p className="text-[11px] text-text-muted">{secondary}</p>
      </div>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-text-muted transition-all group-hover:bg-accent-light group-hover:text-accent">
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
