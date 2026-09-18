'use client';

import { useQuery } from '@tanstack/react-query';
import { searchTrains } from '@/services/api';
import { searchMockTrains } from '@/services/mock-data';
import { useDebounce } from '@/hooks/useDebounce';
import { SEARCH, CACHE } from '@/lib/constants';
import type { Train } from '@/types/train';

export function useTrainSearch(query: string) {
  const debouncedQuery = useDebounce(query, SEARCH.DEBOUNCE_MS);

  return useQuery<Train[]>({
    queryKey: ['trainSearch', debouncedQuery],
    queryFn: async ({ signal }) => {
      try {
        return await searchTrains(debouncedQuery, signal);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          throw err;
        }
        // Fallback to local mock search
        return searchMockTrains(debouncedQuery);
      }
    },
    enabled: debouncedQuery.length >= SEARCH.MIN_QUERY_LENGTH,
    staleTime: CACHE.SEARCH,
    placeholderData: (prev) => prev,
  });
}
