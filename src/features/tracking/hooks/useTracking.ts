'use client';

import { useQuery } from '@tanstack/react-query';
import { getLiveStatus } from '@/services/api';
import { CACHE, REFRESH } from '@/lib/constants';
import type { LiveStatus } from '@/types/train';

export function useTracking(trainNo: string) {
  return useQuery<LiveStatus>({
    queryKey: ['tracking', trainNo],
    queryFn: async () => {
      return await getLiveStatus(trainNo);
    },
    // Only poll while the tab is visible — a hidden tab polling every 15s
    // wastes the visitor's data plan and the upstream API's quota. Jitter the
    // interval so thousands of clients don't synchronize their polls into
    // periodic stampedes against the cache/upstream.
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      return REFRESH.LIVE_STATUS + Math.floor(Math.random() * 5000);
    },
    refetchIntervalInBackground: false,
    staleTime: CACHE.LIVE_STATUS,
    enabled: !!trainNo,
  });
}
