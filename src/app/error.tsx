'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md"
      >
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-error-light">
          <AlertTriangle className="h-8 w-8 text-error" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          We encountered an unexpected error. Please try again.
        </p>
        <Button
          variant="ghost"
          size="md"
          onClick={reset}
          aria-label="Retry loading the page"
          className="mt-6 bg-accent hover:bg-accent-hover hover:text-white text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </motion.div>
    </div>
  );
}