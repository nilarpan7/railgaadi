import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { circuitStates } from '@/lib/circuit-breaker';

export const dynamic = 'force-dynamic';

/**
 * Prometheus-compatible metrics endpoint.
 *
 * Exports system, circuit breaker, and cache health metrics in the Prometheus
 * text exposition format for scraping by Prometheus / Grafana Agent / etc.
 *
 * This endpoint is intentionally lightweight — it reads existing in-memory
 * state (process metrics, circuit map, cache readiness) without introducing
 * new instrumentation counters. Per-request latency histograms and route-level
 * counters can be layered on top by instrumenting `ok()` / `error()` in
 * `src/lib/http.ts` once a metrics library (e.g. `prom-client`) is adopted.
 */

const CIRCUIT_STATE_VALUES: Record<string, number> = {
  closed: 0,
  half_open: 0.5,
  open: 1,
};

export async function GET() {
  const mem = process.memoryUsage();
  const circuits = circuitStates();

  let cacheReady = 1;
  try {
    const ready = await cache.ready();
    cacheReady = ready ? 1 : 0;
  } catch {
    cacheReady = 0;
  }

  const lines: string[] = [];

  // --- Process metrics ---
  lines.push('# HELP process_uptime_seconds Number of seconds the process has been running.');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${process.uptime().toFixed(2)}`);

  lines.push('# HELP process_resident_memory_bytes Resident memory size in bytes.');
  lines.push('# TYPE process_resident_memory_bytes gauge');
  lines.push(`process_resident_memory_bytes ${mem.rss}`);

  lines.push('# HELP process_heap_used_bytes V8 heap used in bytes.');
  lines.push('# TYPE process_heap_used_bytes gauge');
  lines.push(`process_heap_used_bytes ${mem.heapUsed}`);

  lines.push('# HELP process_heap_total_bytes V8 heap total in bytes.');
  lines.push('# TYPE process_heap_total_bytes gauge');
  lines.push(`process_heap_total_bytes ${mem.heapTotal}`);

  // --- Circuit breaker metrics ---
  lines.push('# HELP circuit_breaker_state Current state of circuit breakers (0=closed, 0.5=half_open, 1=open).');
  lines.push('# TYPE circuit_breaker_state gauge');

  lines.push('# HELP circuit_breaker_open_total Number of circuit breakers currently open.');
  lines.push('# TYPE circuit_breaker_open_total gauge');
  let openCount = 0;

  for (const [name, state] of Object.entries(circuits)) {
    const value = CIRCUIT_STATE_VALUES[state] ?? 0;
    lines.push(`circuit_breaker_state{upstream="${name}"} ${value}`);
    if (state === 'open') openCount += 1;
  }

  lines.push(`circuit_breaker_open_total ${openCount}`);

  // --- Cache metrics ---
  lines.push('# HELP cache_ready Whether the shared cache is operational (1=up, 0=down).');
  lines.push('# TYPE cache_ready gauge');
  lines.push(`cache_ready ${cacheReady}`);

  const body = lines.join('\n') + '\n';

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
