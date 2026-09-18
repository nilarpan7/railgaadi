import Link from 'next/link';
import { Train, Code2, ArrowUpRight } from 'lucide-react';

const FEATURE_LINKS = [
  { label: 'Live tracking', href: '/tracking' },
  { label: 'Journey map', href: '/tracking/12952' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Saved journeys', href: '/favorites' },
];

const DATA_SOURCES = [
  { label: 'RailRadar API', href: 'https://railradar.in' },
  { label: 'MapTiler Cloud', href: 'https://www.maptiler.com' },
  { label: 'Open-Meteo', href: 'https://open-meteo.com' },
  { label: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border bg-surface-sunken">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="accent-gradient grid h-8 w-8 place-items-center rounded-xl text-white">
                <Train className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="font-display text-base font-extrabold text-text-primary">
                RailGaadi
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">
              Real-time Indian Railways tracking with vector maps, terrain
              profiles and live weather along the route.
            </p>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Product
            </h4>
            <ul className="space-y-2.5">
              {FEATURE_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-secondary transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Data sources
            </h4>
            <ul className="space-y-2.5">
              {DATA_SOURCES.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-accent"
                  >
                    {item.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              About
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-text-secondary transition-colors hover:text-accent"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
                >
                  <Code2 className="h-3.5 w-3.5" /> Source
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row">
          <p className="text-xs text-text-muted" suppressHydrationWarning>
            © {new Date().getFullYear()} RailGaadi · Built for Indian Railways
            travellers.
          </p>
          {/* Sleeper-coach dot rhythm */}
          <div className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-[3px] bg-accent"
                style={{ opacity: 0.15 + (i / 10) * 0.75 }}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
