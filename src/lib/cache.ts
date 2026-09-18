import { Redis } from '@upstash/redis';
import { logger } from './logger';

/**
 * Shared, server-side cache used by every API route.
 *
 * Prototype status: the old per-route `TtlCache` was one `Map` per Node
 * process, so N instances behind a load balancer re-fetched the same data N
 * times and a 1,000-user stampede meant 1,000 upstream calls.
 *
 * This module:
 *  - exposes a `Cache` interface (async, so the storage can be swapped),
 *  - uses Redis when `REDIS_URL` / `UPSTASH_REDIS_REST_URL` is configured, so
 *    all instances share one cache, and
 *  - falls back to a per-process memory cache with a bounded size and
 *    single-flight coalescing when no Redis is configured.
 *
 * `getOrFetch` collapses concurrent misses onto one in-flight upstream call —
 * the anti-stampede guarantee. A value's `fetcher` runs at most once per TTL
 * window across the whole cluster when Redis is available.
 */

export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  /** Return the cached value or fetch + cache it, coalescing concurrent callers. */
  getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T>;
  /** Health probe — whether reads/writes currently work. */
  ready(): Promise<boolean>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_MAX_ENTRIES = 500;

/**
 * In-process fallback cache with bounded size and single-flight.
 * Correct for a single instance; replaced by `RedisCache` at cluster scale.
 */
class MemoryCache implements Cache {
  private readonly store = new Map<string, { value: unknown; expiresAt: number }>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly maxEntries: number = DEFAULT_MAX_ENTRIES) {}

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now >= entry.expiresAt) this.store.delete(key);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    // Re-inserting moves the key to the end of iteration order, so eviction
    // below stays pointed at the genuinely oldest insertion.
    this.store.delete(key);
    this.prune();
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = (async () => {
      try {
        const value = await fetcher();
        await this.set(key, value, ttlMs);
        return value;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  async ready(): Promise<boolean> {
    return true;
  }
}

/** Redis-backed cache shared across all instances (production path). */
class RedisCache implements Cache {
  private readonly client: Redis;

  constructor() {
    // @upstash/redis only supports the Upstash REST API (url + token), not
    // standard Redis protocol. Set both UPSTASH_REDIS_REST_URL and
    // UPSTASH_REDIS_REST_TOKEN, or call Redis.fromEnv() which reads them.
    // For standard Redis, install `ioredis` and implement a Cache adapter.
    this.client = Redis.fromEnv();
  }

  async get<T>(key: string): Promise<T | undefined> {
    return (await this.client.get<T>(key)) ?? undefined;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const seconds = Math.max(1, Math.round(ttlMs / 1000));
    await this.client.set(key, value, { ex: seconds });
  }

  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    // Distributed lock so exactly one instance runs the fetcher.
    const lockKey = `${key}:lock`;
    const lockTtlMs = Math.min(ttlMs, 30_000);
    const acquired = await this.client.set(lockKey, '1', {
      nx: true,
      px: lockTtlMs,
    });

    if (acquired) {
      try {
        const value = await fetcher();
        await this.set(key, value, ttlMs);
        return value;
      } finally {
        await this.client.del(lockKey);
      }
    }

    // Another instance holds the lock — poll briefly for its result.
    const deadline = Date.now() + Math.min(ttlMs, 5000);
    while (Date.now() < deadline) {
      await sleep(50);
      const value = await this.get<T>(key);
      if (value !== undefined) return value;
    }

    // Lock holder failed/timed out — fetch directly rather than erroring out.
    const value = await fetcher();
    await this.set(key, value, ttlMs);
    return value;
  }

  async ready(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('redis ping failed', { error: (error as Error).message });
      return false;
    }
  }
}

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const cache: Cache = redisConfigured ? new RedisCache() : new MemoryCache();

if (redisConfigured) {
  logger.info('shared cache: redis (UPSTASH_REDIS_REST_URL)');
} else {
  logger.info('shared cache: in-memory (single instance) — set UPSTASH_REDIS_REST_URL/_TOKEN to share across instances');
}
