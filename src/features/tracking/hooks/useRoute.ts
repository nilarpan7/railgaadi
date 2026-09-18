'use client';

import { useQuery } from '@tanstack/react-query';
import { getRoute } from '@/services/api';
import { CACHE } from '@/lib/constants';
import type { RouteData } from '@/types/route';

export function useRoute(trainNo: string) {
  return useQuery<RouteData>({
    queryKey: ['route', trainNo],
    queryFn: async () => {
      return await getRoute(trainNo);
    },
    staleTime: CACHE.ROUTE,
    enabled: !!trainNo,
  });
}
