import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { circuitStates } from '@/lib/circuit-breaker';

export const dynamic = 'force-dynamic';

/**
 * Liveness + readiness probe for load balancers and orchestrators.
 *
 * Returns 200 when the instance can serve traffic; 503 when a critical
 * dependency (the shared cache) is unreachable so the LB can drain it.
 */
export async function GET() {
  const [cacheReady] = await Promise.allSettled([cache.ready()]);

  const healthy = cacheReady.status === 'fulfilled' && cacheReady.value;
  const circuits = circuitStates();

  return NextResponse.json(
    {
      ok: healthy,
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        cache: cacheReady.status === 'fulfilled' ? (cacheReady.value ? 'up' : 'down') : 'error',
      },
      circuits,
    },
    { status: healthy ? 200 : 503 }
  );
}
