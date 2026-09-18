'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Train, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md"
      >
        <div className="accent-gradient mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl text-white shadow-[0_10px_30px_var(--accent-glow)]">
          <Train className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-text-primary">
          This train has left the station
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist. It may have been moved or the
          URL is incorrect.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/tracking"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-surface-alt"
          >
            <Search className="h-4 w-4" />
            Search Trains
          </Link>
        </div>
      </motion.div>
    </div>
  );
}