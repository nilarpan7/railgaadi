/**
 * RailRadar upstream client.
 *
 * One place for the base URL, auth header, timeout and error reporting so a
 * failing upstream call is *loud* instead of silently degrading to mock data.
 *
 * Verified against the live API (2026-08): the service accepts either
 * `Authorization: Bearer <key>` or `x-api-key: <key>`; we send both so a key
 * issued for either convention works. Every response is wrapped in
 * `{ success, data, meta }`, and errors come back as
 * `{ success: false, error: { code, message } }`.
 *
 * All HTTP is delegated to `upstreamFetch` (`@/lib/upstream`) so RailRadar gets
 * the shared circuit breaker, timeout, bounded retries and structured logging.
 */

import { upstreamFetch } from '@/lib/upstream';
import { logger } from '@/lib/logger';

const DEFAULT_BASE = 'https://api.railradar.in/v1';

/** Placeholders that ship in `.env.example` — treated as "no key configured". */
const PLACEHOLDER_KEYS = new Set([
  'rr_live_YOUR_KEY_HERE',
  'YOUR_KEY_HERE',
  'your_key_here',
  '',
]);

export interface UpstreamResult<T = unknown> {
  ok: boolean;
  /** Unwrapped `data` payload on success. */
  data: T | null;
  status: number;
  /** Human-readable reason, present whenever `ok` is false. */
  error: string | null;
}

function baseUrl(): string {
  const configured =
    process.env.RAILRADAR_BASE ||
    process.env.NEXT_PUBLIC_RAILRADAR_BASE ||
    DEFAULT_BASE;
  return configured.replace(/\/+$/, '');
}

/**
 * Resolve the key to use for this request: a per-visitor key forwarded from the
 * browser (bring-your-own-key) wins over the server's env key.
 */
export function resolveApiKey(headerKey: string | null | undefined): string | null {
  const candidate = (headerKey || process.env.RAILRADAR_API_KEY || '').trim();
  if (!candidate || PLACEHOLDER_KEYS.has(candidate)) return null;
  return candidate;
}

/**
 * GET a RailRadar endpoint and unwrap the `{ success, data }` envelope.
 * Never throws — inspect `ok`/`error` on the result.
 */
export async function railradarGet<T = unknown>(
  path: string,
  apiKey: string | null,
  timeoutMs = 8000
): Promise<UpstreamResult<T>> {
  if (!apiKey) {
    return {
      ok: false,
      data: null,
      status: 0,
      error: 'No RailRadar API key configured (set RAILRADAR_API_KEY or add one in the app).',
    };
  }

  const url = `${baseUrl()}/${path.replace(/^\/+/, '')}`;

  const result = await upstreamFetch<T>('railradar', url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
    timeoutMs,
    circuit: 'railradar',
    idempotent: true,
  });

  if (result.ok && typeof result.data === 'object' && result.data !== null) {
    const envelope = result.data as Record<string, unknown>;
    if (envelope.success === false) {
      const err = envelope.error as Record<string, unknown> | undefined;
      const message =
        typeof err?.message === 'string'
          ? err.message
          : `RailRadar ${path} failed: HTTP ${result.status}`;
      const code = typeof err?.code === 'string' ? ` [${err.code}]` : '';
      logger.warn(`railradar upstream error`, { path, message: `${message}${code}` });
      return { ok: false, data: null, status: result.status, error: `${message}${code}` };
    }
    // RailRadar wraps successful payloads in { success, data, meta }.
    if ('data' in envelope) {
      return { ok: true, data: envelope.data as T, status: result.status, error: null };
    }
  }

  return {
    ok: result.ok,
    data: result.ok ? (result.data as T) : null,
    status: result.status,
    error: result.error,
  };
}
