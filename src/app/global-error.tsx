'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Global unhandled error:', error);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-error-light">
            <AlertTriangle className="h-8 w-8 text-error" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-text-primary">
            Critical error
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            The application encountered a fatal error. Please refresh the page.
          </p>
          <Button
            variant="ghost"
            size="md"
            onClick={reset}
            aria-label="Refresh the page"
            className="mt-6 bg-accent hover:bg-accent-hover hover:text-white text-white"
          >
            Refresh Page
          </Button>
        </div>
      </body>
    </html>
  );
}