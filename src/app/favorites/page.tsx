'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Train,
  ArrowRight,
  Trash2,
  Radio,
  LogIn,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { useFavoritesStore } from '@/store/favorites';
import {
  AuroraBackground,
  Button,
  ButtonLink,
  Eyebrow,
  GridPattern,
  NoiseOverlay,
  ScrollProgress,
  SpotlightCard,
} from '@/components/ui';
import { SPRING } from '@/lib/motion';

export default function FavoritesPage() {
  const { data: session } = useSession();
  const { favorites, removeFavorite } = useFavoritesStore();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredFavorites = favorites.filter(
    (f) =>
      f.trainName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.trainNumber.includes(filterQuery) ||
      f.source.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.destination.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pb-28 md:pb-12">
        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-border/60 px-4 pt-10 pb-14 sm:px-6 lg:px-8">
          <AuroraBackground intensity={0.65} />
          <GridPattern className="opacity-[0.45]" />
          <NoiseOverlay />

          <div className="relative mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={SPRING.soft}
              className="accent-gradient mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl shadow-[0_14px_40px_var(--accent-glow)] text-white"
            >
              <Heart className="h-7 w-7 fill-current" />
            </motion.div>

            <Eyebrow icon={<Radio className="h-3 w-3" />}>Personal Hub</Eyebrow>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl"
            >
              Saved <span className="text-gradient">Journeys</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mx-auto mt-2 max-w-lg text-sm text-text-secondary"
            >
              Quick-access shortcuts to your favorite Indian Railways routes with one-tap live GPS tracking.
            </motion.p>
          </div>
        </section>

        {/* Content Container */}
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
          {!session?.user ? (
            /* Guest Prompt */
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium rounded-3xl p-8 sm:p-10 text-center space-y-4 max-w-md mx-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center mx-auto shadow-xs">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">
                Sign in to sync your saved journeys
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Save unlimited favorite trains, receive real-time delay notifications, and sync across all your devices.
              </p>
              <Link
                href="/login?callbackUrl=/favorites"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with 1-Click Demo</span>
              </Link>
            </motion.div>
          ) : favorites.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium rounded-3xl p-10 text-center space-y-4 border-dashed"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-alt text-text-muted flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-text-primary">
                No saved trains yet
              </h2>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Search for any train and tap the heart icon on its tracking console to pin it here.
              </p>
              <Link
                href="/tracking"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-sm"
              >
                <Train className="w-4 h-4" />
                <span>Explore Directory</span>
              </Link>
            </motion.div>
          ) : (
            /* Favorites List */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-bold text-text-primary">
                    Pinned Services ({favorites.length})
                  </h2>
                </div>

                {/* Filter Input */}
                {favorites.length > 3 && (
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter saved trains…"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-accent transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {filteredFavorites.map((f, i) => (
                    <motion.div
                      key={f.trainNumber}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <SpotlightCard className="p-0 overflow-hidden">
                        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-accent-light text-accent flex items-center justify-center shrink-0 border border-accent/20">
                            <Train className="w-5 h-5" />
                          </div>

                          <Link
                            href={`/tracking/${f.trainNumber}`}
                            className="flex-1 min-w-0 group"
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm sm:text-base font-extrabold text-text-primary group-hover:text-accent transition-colors truncate">
                                {f.trainName}
                              </p>
                              <span className="font-mono text-xs font-bold text-accent bg-accent-light px-2 py-0.5 rounded-md">
                                #{f.trainNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-text-secondary mt-1 font-medium">
                              <span>{f.source}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span>{f.destination}</span>
                            </div>
                          </Link>

                          <div className="flex items-center gap-2 shrink-0">
                            <ButtonLink
                              href={`/tracking/${f.trainNumber}`}
                              variant="ghost"
                              size="sm"
                              className="hidden sm:inline-flex bg-surface-alt hover:bg-accent hover:text-white text-text-secondary rounded-xl"
                            >
                              <span>Live Map</span>
                              <ArrowRight className="w-3 h-3" />
                            </ButtonLink>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFavorite(f.trainNumber)}
                              className="text-text-muted hover:text-red-500 hover:bg-red-500/10"
                              aria-label="Remove favorite"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
