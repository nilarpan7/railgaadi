'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Cloud,
  Compass,
  Gauge,
  Globe2,
  MapPin,
  Mountain,
  Radio,
  Sparkles,
  Train,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/features/search/components/search-bar';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { POPULAR_TRAINS } from '@/services/mock-data';
import { cn, getTrainTypeColor } from '@/lib/utils';
import {
  AnimatedCounter,
  AuroraBackground,
  Badge,
  ButtonLink,
  Eyebrow,
  GridPattern,
  Marquee,
  NoiseOverlay,
  Reveal,
  RevealGroup,
  RevealItem,
  ScrollProgress,
  Section,
  SectionHeading,
  SpotlightCard,
  SplitText,
  TiltCard,
} from '@/components/ui';
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

const STATS = [
  { value: 13000, suffix: '+', label: 'Trains reachable' },
  { value: 8000, suffix: '+', label: 'Stations mapped' },
  { value: 15, suffix: 's', label: 'Live refresh' },
  { value: 99.9, suffix: '%', label: 'Map uptime', decimals: 1 },
];

const DATA_PARTNERS = [
  'RailRadar Telemetry',
  'MapTiler Vector Tiles',
  'MapLibre GL',
  'Open-Meteo',
  'OpenWeather',
  'Overpass / OSM',
  'OpenTopoData DEM',
];

const FEATURES = [
  {
    icon: MapPin,
    title: 'Live vector journey map',
    body: 'WebGL basemaps with a dual-tone railway track: solid ahead of the engine, dashed behind it, station pins that flip as you pass them.',
    tone: 'accent' as const,
  },
  {
    icon: BarChart3,
    title: 'Delay & progress analytics',
    body: 'Station-by-station delay trend, journey completion donut and speed history — computed from the same feed that drives the map.',
    tone: 'info' as const,
  },
  {
    icon: Mountain,
    title: 'Terrain elevation profile',
    body: 'Real DEM samples along the polyline, so you know when the ghats, tunnels and river bridges are coming up.',
    tone: 'success' as const,
  },
  {
    icon: Cloud,
    title: 'Weather at every stop',
    body: 'Live conditions for the current, next and final station. Falls back to Open-Meteo automatically — no key required.',
    tone: 'warning' as const,
  },
  {
    icon: Compass,
    title: 'Nearby discovery',
    body: 'Rivers, peaks, forts and viewpoints within range of the train, pulled live from OpenStreetMap.',
    tone: 'accent' as const,
  },
  {
    icon: Gauge,
    title: '15-second telemetry',
    body: 'Speed, platform, ETA and remaining distance refresh on a fixed cadence with graceful offline fallbacks.',
    tone: 'info' as const,
  },
];

const STEPS = [
  {
    title: 'Search any train',
    body: 'Type a name or number — results rank by relevance as you type, with recents one keystroke away.',
  },
  {
    title: 'Watch it move',
    body: 'The map frames the whole route, then follows the engine. Tap any station for platform and timing detail.',
  },
  {
    title: 'Plan the rest',
    body: 'Weather, elevation and landmarks for the road ahead, all on one screen.',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const trackHref = session ? '/tracking' : '/login';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* ================= HERO ================= */}
        <section className="relative z-30 border-b border-border">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AuroraBackground />
            <GridPattern />
            <NoiseOverlay />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="text-center"
            >
              <motion.div variants={fadeUp} className="mb-7 flex justify-center">
                <Badge tone="accent" size="md" dot>
                  Live Indian Railways telemetry
                </Badge>
              </motion.div>

              <SplitText
                as="h1"
                text="Track your train the way it deserves"
                highlight={['train']}
                className="font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-text-primary sm:text-6xl lg:text-[4.25rem]"
              />

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-text-secondary sm:text-lg"
              >
                Live GPS position on a vector map, station-level delays,
                elevation ahead and weather at every stop — one screen, updated
                every 15 seconds.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mx-auto mt-9 max-w-2xl"
              >
                <SearchBar variant="hero" />
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-text-muted"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-accent" />
                  Live GPS updates
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5 text-accent-teal" />
                  Vector dark maps
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-accent-2" />
                  Instant ETA analytics
                </span>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <ButtonLink href="/tracking/12952" size="lg" shine>
                  Track a live train
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href={trackHref} variant="outline" size="lg">
                  {session ? 'Open dashboard' : 'Create free account'}
                </ButtonLink>
              </motion.div>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={staggerContainer}
              className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
            >
              {STATS.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  className="glass-card rounded-2xl px-4 py-5 text-center"
                >
                  <div className="font-display text-2xl font-extrabold text-text-primary sm:text-3xl">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      decimals={stat.decimals ?? 0}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ================= DATA MARQUEE ================= */}
        <section className="border-b border-border bg-surface-sunken py-7">
          <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
            Powered by open geospatial infrastructure
          </p>
          <Marquee duration={38}>
            {DATA_PARTNERS.map((name) => (
              <span
                key={name}
                className="mx-4 inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-text-secondary"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {name}
              </span>
            ))}
          </Marquee>
        </section>

        {/* ================= FEATURES ================= */}
        <Section id="features">
          <SectionHeading
            eyebrow="What you get"
            eyebrowIcon={<Sparkles className="h-3 w-3" />}
            title={
              <>
                A travel companion,{' '}
                <span className="font-normal italic text-text-secondary">
                  not a status page.
                </span>
              </>
            }
            description="Everything is derived from the same live feed, so the map, the timeline and the analytics never disagree with each other."
          />

          <RevealGroup className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <RevealItem key={feature.title}>
                  <SpotlightCard className="h-full p-6">
                    <div
                      className={cn(
                        'mb-4 grid h-11 w-11 place-items-center rounded-2xl',
                        feature.tone === 'accent' &&
                          'bg-accent-light text-accent',
                        feature.tone === 'info' && 'bg-info-light text-info',
                        feature.tone === 'success' &&
                          'bg-success-light text-success',
                        feature.tone === 'warning' &&
                          'bg-warning-light text-warning'
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {feature.body}
                    </p>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Section>

        {/* ================= SHOWCASE ================= */}
        <Section className="border-t border-border bg-surface-sunken">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <Eyebrow icon={<Radio className="h-3 w-3" />}>
                Live telemetry
              </Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-text-primary sm:text-4xl">
                We know where your train is.
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-text-secondary">
                Position, speed, delay and platform sync every 15 seconds. When
                the upstream feed drops, RailGaadi degrades to a cached schedule
                instead of an error screen.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  'Engine position interpolated along the real track polyline',
                  'Station pins recolour the moment you pass them',
                  'Follow-mode camera that releases the instant you pan',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-light text-accent">
                      <Zap className="h-3 w-3" />
                    </span>
                    <p className="text-sm text-text-secondary">{line}</p>
                  </div>
                ))}
              </div>

              <div className="mt-9">
                <ButtonLink href="/tracking/12952" size="md">
                  See it live
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <TiltCard className="card-premium rounded-[26px] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm font-bold text-text-primary">
                      Mumbai Rajdhani
                    </p>
                    <p className="font-mono text-[11px] text-text-muted">
                      #12952 · NDLS → BCT
                    </p>
                  </div>
                  <Badge tone="success" size="sm" dot>
                    On time
                  </Badge>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-text-muted">
                      <span>Journey progress</span>
                      <span className="tabular text-accent">62%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '62%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                        className="accent-gradient-animated h-full rounded-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Speed', value: '118 km/h' },
                      { label: 'Next stop', value: 'BRC' },
                      { label: 'Platform', value: 'PF 3' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-border bg-surface-alt px-3 py-2.5"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-text-primary">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-alt p-4">
                    <div className="flex items-center gap-2">
                      <span className="accent-gradient grid h-7 w-7 place-items-center rounded-xl text-white">
                        <Train className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-xs font-semibold text-text-primary">
                        Approaching Vadodara Jn — 4 min early
                      </p>
                    </div>
                    <p className="mt-2 text-[10px] text-text-muted">
                      Live update · refreshed just now
                    </p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </Section>

        {/* ================= HOW IT WORKS ================= */}
        <Section className="border-t border-border">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps, no setup"
            description="No account needed to watch a train. Sign in only when you want to save journeys."
          />

          <div className="relative mt-14">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent md:block"
            />
            <RevealGroup className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <RevealItem key={step.title} className="relative text-center">
                  <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface font-display text-base font-extrabold text-accent shadow-md">
                    {index + 1}
                  </div>
                  <h3 className="font-display text-lg font-bold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
                    {step.body}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>

        {/* ================= POPULAR ROUTES ================= */}
        <Section className="border-t border-border bg-surface-sunken">
          <SectionHeading
            align="left"
            eyebrow="Popular routes"
            title="Ready to track a train?"
            description="Jump straight into a live journey."
            action={
              <ButtonLink href="/tracking" variant="outline" size="md">
                Browse all
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            }
          />

          <RevealGroup className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_TRAINS.map((train) => (
              <RevealItem key={train.number}>
                <Link
                  href={`/tracking/${train.number}`}
                  className="card-premium group block h-full rounded-[22px] p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-sm font-bold text-text-primary transition-colors group-hover:text-accent">
                        {train.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-text-muted">
                        #{train.number}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        getTrainTypeColor(train.type)
                      )}
                    >
                      {train.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="truncate font-semibold">
                      {train.source.name}
                    </span>
                    <span className="flex flex-1 items-center gap-0.5">
                      <span className="h-px flex-1 bg-border-strong" />
                      <ArrowRight className="h-3 w-3 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-0.5" />
                      <span className="h-px flex-1 bg-border-strong" />
                    </span>
                    <span className="truncate font-semibold">
                      {train.destination.name}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-text-muted">
                    <span className="tabular">{train.departureTime}</span>
                    <span>{train.duration}</span>
                    <span className="tabular">{train.totalDistance} km</span>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>

        {/* ================= CTA ================= */}
        <Section className="border-t border-border">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-border bg-surface px-6 py-16 text-center sm:px-12">
              <AuroraBackground className="opacity-70" />
              <GridPattern />
              <div className="relative">
                <Eyebrow icon={<Train className="h-3 w-3" />}>
                  Start tracking
                </Eyebrow>
                <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-text-primary sm:text-[2.6rem]">
                  Your next journey, fully mapped.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-secondary">
                  Free, no ads, and every data source is open. Bring your own
                  API key for full live telemetry.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <ButtonLink href="/tracking/12952" size="lg" shine>
                    Track 12952 now
                    <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink href="/analytics" variant="glass" size="lg">
                    Explore analytics
                  </ButtonLink>
                </div>
              </div>
            </div>
          </Reveal>
        </Section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
