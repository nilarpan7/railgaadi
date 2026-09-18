import { getCircuit } from './circuit-breaker';
import { logger } from './logger';

/**
 * Unified upstream HTTP client.
 *
 * Every external call (RailRadar, OpenWeatherMap, Open-Meteo, Overpass,
 * OpenTopoData) funnels through this module so it gets, consistently:
 *
 * - a circuit breaker per upstream (fail fast instead of queueing),
 * - a hard request timeout,
 * - bounded retries with full jitter for idempotent requests,
 * - structured logging of duration, status, and fallback reasons.
 *
 * It never throws — callers inspect `ok`/`error` on the result.
 */

export interface UpstreamResult<T = unknown> {
  ok: boolean;
  /** Parsed JSON body on success. */
  data: T | null;
  status: number;
  /** Human-readable reason, present whenever `ok` is false. */
  error: string | null;
  /** Wall-clock time of the (last) attempt in ms. */
  ms: number;
  /** Number of attempts made. */
  attempts: number;
}

export interface UpstreamOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  /** Abort the request after this many ms. */
  timeoutMs?: number;
  /** Extra attempts beyond the first (only honoured for idempotent requests). */
  retries?: number;
  /** Circuit breaker name; pass '' to disable the breaker. */
  circuit?: string;
  /** Whether retrying the request is safe (POSTs must be false unless idempotent). */
  idempotent?: boolean;
}

const DEFAULT_TIMEOUT_MS = 8000;
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

// Query parameters that may carry credentials and must never reach the logs.
const SECRET_PARAMS = new Set([
  'appid',
  'key',
  'api_key',
  'apikey',
  'token',
  'secret',
  'password',
  'authorization',
]);

/** Strip credential-bearing query params before a URL is written to logs. */
function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const [name] of url.searchParams) {
      if (SECRET_PARAMS.has(name.toLowerCase())) url.searchParams.set(name, '[REDACTED]');
    }
    return url.toString();
  } catch {
    // Not a parseable URL — cannot carry query-string secrets.
    return rawUrl;
  }
}

function isJsonResponse(headers: Headers): boolean {
  const contentType = headers.get('content-type') || '';
  return contentType.includes('application/json') || contentType.includes('+json');
}

export async function upstreamFetch<T = unknown>(
  name: string,
  url: string,
  options: UpstreamOptions = {}
): Promise<UpstreamResult<T>> {
  const {
    method = 'GET',
    headers,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 2,
    circuit = name,
    idempotent = method === 'GET',
  } = options;

  const breaker = circuit ? getCircuit(circuit) : null;

  if (breaker && !breaker.allowRequest()) {
    return {
      ok: false,
      data: null,
      status: 0,
      error: `${name} circuit open — skipping upstream`,
      ms: 0,
      attempts: 0,
    };
  }

  const maxAttempts = idempotent ? Math.max(1, retries + 1) : 1;
  const startedAt = Date.now();
  let lastError = `HTTP error`;
  let lastStatus = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const attemptStart = Date.now();

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });

      const isRetryable = RETRYABLE_STATUSES.has(response.status) && idempotent;

      // A 4xx (other than 429) is a client error — never a transient failure,
      // never retried, and never tripped the circuit.
      if (!response.ok && response.status >= 400 && response.status < 500 && response.status !== 429) {
        breaker?.recordSuccess(); // 4xx means the upstream is healthy
        const text = await response.text().catch(() => '');
        logger.warn(`upstream ${name} rejected request`, {
          url: redactUrl(url),
          status: response.status,
          ms: Date.now() - attemptStart,
        });
        return {
          ok: false,
          data: null,
          status: response.status,
          error: `${name} rejected request (HTTP ${response.status})${text ? `: ${text.slice(0, 200)}` : ''}`,
          ms: Date.now() - startedAt,
          attempts: attempt + 1,
        };
      }

      if (response.ok) {
        breaker?.recordSuccess();
        const data = isJsonResponse(response.headers)
          ? ((await response.json()) as T)
          : (null as T | null);
        return {
          ok: true,
          data,
          status: response.status,
          error: null,
          ms: Date.now() - startedAt,
          attempts: attempt + 1,
        };
      }

      // Transient failure (5xx / 429 / network) — retryable if idempotent.
      breaker?.recordFailure();
      lastError = `${name} failed (HTTP ${response.status})`;
      lastStatus = response.status;
      logger.warn(`upstream ${name} transient failure`, {
        url: redactUrl(url),
        status: response.status,
        attempt: attempt + 1,
        ms: Date.now() - attemptStart,
      });

      if (!isRetryable) break;
    } catch (error) {
      breaker?.recordFailure();
      lastStatus = 0;
      lastError =
        error instanceof Error
          ? error.name === 'TimeoutError' || error.name === 'AbortError'
            ? `${name} timed out after ${timeoutMs}ms`
            : `${name} request failed: ${error.message}`
          : `${name} request failed: unknown error`;
      logger.warn(lastError, {
        url: redactUrl(url),
        attempt: attempt + 1,
        ms: Date.now() - attemptStart,
      });
      if (attempt >= maxAttempts - 1) break;
    }

    if (attempt < maxAttempts - 1) {
      // Full jitter keeps retry storms from synchronizing across clients.
      const backoffMs = Math.min(2000 * 2 ** attempt, 8000) * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  return {
    ok: false,
    data: null,
    status: lastStatus,
    error: lastError,
    ms: Date.now() - startedAt,
    attempts: maxAttempts,
  };
}
