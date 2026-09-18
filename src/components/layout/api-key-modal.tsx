'use client';

import { useCallback, useEffect, useState } from 'react';
import { Key, Check, X, Sparkles, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMounted } from '@/hooks/useMounted';
import { SPRING } from '@/lib/motion';

/** Reads a stored key without touching `localStorage` during SSR. */
function readKey(name: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(name) ?? '';
  } catch {
    return '';
  }
}

function writeKey(name: string, value: string) {
  try {
    const trimmed = value.trim();
    if (trimmed) window.localStorage.setItem(name, trimmed);
    else window.localStorage.removeItem(name);
  } catch {
    /* private mode / storage disabled — nothing we can do */
  }
}

const FIELDS = [
  {
    storageKey: 'rr_live_key',
    label: 'RailRadar Live API Key',
    placeholder: 'rr_live_YourKeyHere',
    hint: 'Free developer sandbox key from railradar.in',
    href: 'https://railradar.in',
    required: true,
  },
  {
    storageKey: 'maptiler_key',
    label: 'MapTiler Key',
    placeholder: 'Your MapTiler Cloud key',
    hint: 'Optional — CARTO basemaps are used when empty.',
    href: 'https://cloud.maptiler.com',
    required: false,
  },
  {
    storageKey: 'owm_key',
    label: 'OpenWeather Key',
    placeholder: 'Your OpenWeather API key',
    hint: 'Optional — Open-Meteo (no key) is used when empty.',
    href: 'https://openweathermap.org/api',
    required: false,
  },
] as const;

export function ApiKeyModal() {
  const mounted = useMounted();
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Lazy initialisers: read once, on the client, without a setState-in-effect.
  const [keys, setKeys] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.storageKey, readKey(f.storageKey)]))
  );

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    FIELDS.forEach((f) => writeKey(f.storageKey, keys[f.storageKey] ?? ''));
    setSaved(true);
    // A reload is the simplest way to re-mint every cached query with the new keys.
    window.setTimeout(() => window.location.reload(), 900);
  };

  const railradarKey = keys.rr_live_key ?? '';
  const connected = railradarKey.trim().length > 5;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!mounted}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={SPRING.snappy}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/60 px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary disabled:opacity-50"
      >
        <Key className="h-3.5 w-3.5 text-accent" />
        <span className="hidden sm:inline">
          {connected ? 'Live API connected' : 'API config'}
        </span>
        <span className="sm:hidden">API</span>
        {connected && <span className="live-dot" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="api-key-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md"
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={SPRING.soft}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="api-key-title"
              className="relative my-auto w-full max-w-md overflow-hidden rounded-[26px] border border-border bg-surface p-6 shadow-2xl"
            >
              {/* accent wash */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-[64px]"
              />

              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-light text-accent">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="api-key-title"
                    className="font-display text-base font-bold text-text-primary"
                  >
                    Live data credentials
                  </h3>
                  <p className="text-xs text-text-muted">
                    Stored in this browser only — never sent to our servers.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="relative space-y-4">
                {FIELDS.map((field, i) => (
                  <motion.div
                    key={field.storageKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.06, duration: 0.3 }}
                  >
                    <label
                      htmlFor={field.storageKey}
                      className="mb-1 flex items-center gap-1.5 text-xs font-bold text-text-primary"
                    >
                      {field.label}
                      {!field.required && (
                        <span className="font-medium text-text-muted">
                          (optional)
                        </span>
                      )}
                    </label>
                    <input
                      id={field.storageKey}
                      name={field.storageKey}
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      value={keys[field.storageKey] ?? ''}
                      onChange={(e) =>
                        setKeys((prev) => ({
                          ...prev,
                          [field.storageKey]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 font-mono text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-text-muted">
                      {field.hint}
                      <a
                        href={field.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-accent hover:underline"
                      >
                        Get key <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </p>
                  </motion.div>
                ))}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-success">
                    <Sparkles className="h-3.5 w-3.5" /> Open-Meteo &amp;
                    Overpass active
                  </span>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING.snappy}
                    className="accent-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md"
                  >
                    {saved ? (
                      <>
                        <Check className="h-4 w-4" /> Saved
                      </>
                    ) : (
                      'Save keys'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
