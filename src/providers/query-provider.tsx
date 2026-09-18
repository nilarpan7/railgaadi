'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: (failureCount, error) => {
              if (failureCount >= 1) return false;
              if ((error as Error)?.name === 'AbortError') return false;
              const msg = (error as Error)?.message || '';
              if (msg.includes('400') || msg.includes('404') || msg.includes('429')) return false;
              return true;
            },
            retryDelay: 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
