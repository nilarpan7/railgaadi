import { logger } from './logger';

/**
 * Sliding-fixed-window rate limiter, keyed by client (IP or user id).
 *
 * In-memory per process, which is correct for a single instance. At cluster
 * scale the same interface must move to Redis (atomic INCR + EXPIRE) so the
 * budget is shared — see `cache.ts` for the storage-swap pattern.
 *
 * The window store is bounded and periodically pruned so abusive clients can't
 * grow memory without limit.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds the client should wait before retrying (0 when allowed). */
  retryAfterSec: number;
}

export interface RateLimitConfig {
  /** Max requests per `windowMs` per key. */
  limit: number;
  windowMs: number;
}

interface WindowEntry {
  count: number;
  windowStart: number;
  windowMs: number;
}

const store = new Map<string, WindowEntry>();
const MAX_KEYS = 100_000;

// Prune expired windows once a minute so the map stays bounded. Each entry
// knows its own window length, so longer windows aren't dropped mid-window.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= entry.windowMs) store.delete(key);
  }
}, 60_000).unref();

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();

  if (store.size >= MAX_KEYS) {
    // Shed load instead of evicting live counters: prefer fresh offenders.
    logger.warn('rate limiter store at capacity — rejecting new keys', { key });
    return { allowed: false, retryAfterSec: Math.ceil(config.windowMs / 1000) };
  }

  let entry = store.get(key);
  if (!entry || now - entry.windowStart >= config.windowMs) {
    entry = { count: 0, windowStart: now, windowMs: config.windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > config.limit) {
    const elapsed = now - entry.windowStart;
    const retryAfterSec = Math.max(1, Math.ceil((config.windowMs - elapsed) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Convenience wrapper keyed on the client IP. `scope` namespaces the budget so
 * different routes (search, live, auth, ...) don't consume each other's quota.
 */
export function rateLimitByIp(
  ip: string,
  config: RateLimitConfig,
  scope = 'api'
): RateLimitResult {
  return rateLimit(`${scope}:ip:${ip}`, config);
}
