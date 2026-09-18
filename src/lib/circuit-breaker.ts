/**
 * Per-upstream circuit breaker.
 *
 * Prevents a slow or failing upstream (RailRadar, Overpass, ...) from
 * consuming every request slot and stalling the whole app. When a breaker is
 * *open* the upstream is skipped entirely — callers fall back to cache/demo
 * data — and a single probe request is allowed after the cooldown to test
 * recovery (half-open).
 *
 * One instance per upstream name, shared process-wide, so all route handlers
 * observe the same circuit state.
 */

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  /** Consecutive failures that trip the breaker open. */
  failureThreshold: number;
  /** How long the breaker stays open before probing (ms). */
  openTimeoutMs: number;
  /** Successful probe responses needed to close from half-open. */
  halfOpenSuccessThreshold: number;
}

const DEFAULTS: CircuitBreakerOptions = {
  failureThreshold: 5,
  openTimeoutMs: 30_000,
  halfOpenSuccessThreshold: 2,
};

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private openedAt = 0;
  private readonly opts: CircuitBreakerOptions;

  constructor(name: string, opts: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.opts = { ...DEFAULTS, ...opts };
  }

  readonly name: string;

  get stateName(): CircuitState {
    return this.state;
  }

  /** Whether a new request is allowed to reach the upstream now. */
  allowRequest(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.opts.openTimeoutMs) {
        this.state = 'half_open';
        this.consecutiveSuccesses = 0;
        return true;
      }
      return false;
    }
    // half-open: allow the probe request.
    return true;
  }

  recordSuccess(): void {
    if (this.state === 'half_open') {
      this.consecutiveSuccesses += 1;
      if (this.consecutiveSuccesses >= this.opts.halfOpenSuccessThreshold) {
        this.reset();
      }
    } else if (this.state === 'closed') {
      this.consecutiveFailures = 0;
    }
  }

  recordFailure(): void {
    if (this.state === 'half_open') {
      // Probe failed — back to open.
      this.state = 'open';
      this.openedAt = Date.now();
      return;
    }
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.opts.failureThreshold) {
      this.trip();
    }
  }

  /** Force the breaker open (e.g. admin/health signal). */
  trip(): void {
    this.state = 'open';
    this.openedAt = Date.now();
  }

  /** Force a healthy closed state. */
  reset(): void {
    this.state = 'closed';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.openedAt = 0;
  }
}

const circuits = new Map<string, CircuitBreaker>();

/** Get (or lazily create) the circuit breaker for an upstream name. */
export function getCircuit(name: string, opts?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  let circuit = circuits.get(name);
  if (!circuit) {
    circuit = new CircuitBreaker(name, opts);
    circuits.set(name, circuit);
  }
  return circuit;
}

/** Snapshot of all breaker states, for the health endpoint. */
export function circuitStates(): Record<string, CircuitState> {
  const out: Record<string, CircuitState> = {};
  for (const [name, circuit] of circuits) out[name] = circuit.stateName;
  return out;
}
