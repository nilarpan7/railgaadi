# RailGaadi — Production Deployment Runbook

> **Baseline**: This guide assumes the hardening already shipped — shared cache seams, circuit breakers, rate limiting, structured JSON logging, readiness probes, error envelopes, and nonce-based CSP.

---

## 0. Deployment Prerequisites (in the codebase)

| Capability | Where | Status |
|---|---|---|
| Readiness/liveness probe | `GET /api/health` (200/503, cache + circuit state) | ✅ Ready |
| Structured JSON logs | `src/lib/logger.ts` (`LOG_LEVEL`, `x-request-id` correlation) | ✅ Ready |
| Strict CSP (nonce-based) | `src/proxy.ts` middleware | ✅ Ready |
| Security headers | `next.config.ts` + Next 16 defaults (HSTS, X-Frame-Options, etc.) | ✅ Ready |
| Rate limiting per route | `src/lib/rate-limiter.ts` + `src/lib/http.ts` | ⚠️ Per-instance |
| Circuit breakers per upstream | `src/lib/circuit-breaker.ts` | ⚠️ Per-instance |
| Shared cache seam | `src/lib/cache.ts` (Upstash Redis or in-memory) | ⚠️ Enable Redis for multi-instance |
| Prometheus metrics | `GET /api/metrics` (process, circuits, cache) | ✅ Ready |

### Two honest production caveats

1. **Rate limiter & circuit breaker are in-memory per instance.** At 1–2 instances this is fine; beyond that, budgets aren't global and circuit state isn't shared. The seam to make them Redis-backed exists (`rateLimit()` and `getCircuit()` are small, swappable functions).

2. **No persistent user data.** Favorites/recents are device-local `localStorage`. There is no database. If per-account sync is required, provision a store (Postgres/edge KV) first — nothing in this guide depends on it.

---

## 1. Provision Environment & Secrets

Create the production environment config from `.env.example`. Values marked 🔒 must never enter the repo — manage them in your platform's secret store.

```bash
cp .env.example .env.production  # template only; fill in the platform secret store
```

| Variable | Production value | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://railgaadi.example.com` | Real origin — drives OG meta + auth redirects |
| `AUTH_SECRET` 🔒 | `openssl rand -base64 32` | NextAuth encryption; never rotate without a grace window |
| `AUTH_TRUST_HOST` | `true` | Required behind TLS/proxies (avoids `UntrustedHost` errors) |
| `RAILRADAR_API_KEY` 🔒 | real key | Server-side; never `NEXT_PUBLIC_` |
| `OPENWEATHER_API_KEY` 🔒 | real key or empty | Empty → app falls back to Open-Meteo |
| `NEXT_PUBLIC_MAPTILER_KEY` | real key | Public; restrict domain in MapTiler console |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` 🔒 | from Upstash | Enables the shared multi-instance cache |
| `LOG_LEVEL` | `info` | `debug` temporarily for tracing `x-request-id` |
| `NODE_ENV` | `production` | Platform sets this |

**Rules:**
- `.gitignore` already excludes `.env*` except `.env.example` — keep it that way.
- Never prefix server secrets with `NEXT_PUBLIC_` (they'd ship in the browser bundle).
- Generate one `AUTH_SECRET` per environment (prod/staging differ).

---

## 2. Containerization

### 2.1 Standalone output

`next.config.ts` is configured with `output: 'standalone'`. Running `npm run build` produces `.next/standalone/` — a self-contained server with minimal `node_modules`.

### 2.2 Dockerfile

The project includes a multi-stage `Dockerfile`:

| Stage | Purpose |
|---|---|
| `deps` | Install production dependencies via `npm ci` |
| `builder` | Copy deps + source, run `npm run build` |
| `runner` | Node 22 Alpine, non-root `nextjs` user, standalone output only |

Key properties:
- **Multi-stage** → runtime image contains only the standalone output (tens of MB, no toolchain).
- **`USER nextjs`** → non-root: a container compromise can't write into the FS.
- **`HEALTHCHECK`** → hits `/api/health`; your orchestrator/LB uses it for traffic routing.

### 2.3 .dockerignore

Excludes `node_modules`, `.next`, `.git`, `.env*` (except `.env.example`), `maptest`, build artifacts.

---

## 3. CI/CD Pipeline

### 3.1 Workflow (`.github/workflows/deploy.yml`)

**Stages:** verify → build image → scan → push → deploy.

| Stage | Trigger | Actions |
|---|---|---|
| `verify` | All pushes + PRs | `npm ci`, `npm run lint`, `npm run build` (typecheck), `npm audit --audit-level=high` |
| `build-and-push` | `main` only | Docker Buildx build, push to GHCR with `:latest` + `:$sha`, Trivy CRITICAL scan |
| `deploy` | `main` only | SSH + `docker compose pull && up -d --no-deps app` (or K8s `kubectl set image`) |

**Key practices:**
- PRs never deploy — only `main`.
- Immutable tags (`:${{ github.sha }}`) → instant, exact rollback.
- Trivy image scan + `npm audit` → CVEs block the pipeline.
- `environment: production` → approval gates and per-env secrets.

### 3.2 Staging environment

Duplicate the deploy job with `environment: staging` and a pre-production smoke-test step (hit `/api/health`, then run the §10 checklist) before promoting.

---

## 4. Hosting Architecture

| Path | Best for | Notes |
|---|---|---|
| **A. Container platform** (Railway / Fly.io / Render / Docker VM) | Fastest full control | Use the Dockerfile; set `UPSTASH_REDIS_REST_*`, ≥2 replicas |
| **B. Kubernetes** (EKS/GKE) | Scale + HA at org level | Use §6 probes/replicas; container platform abstracts this |
| **C. Vercel** | Zero-ops, max CDN | No Docker needed; set env vars, `standalone` not required |

**Recommended:** A (Docker on managed container platform) or C (Vercel).

### Reference architecture (path A/B)

```
Edge/CDN (TLS, WAF, static caching)
        │
  Load Balancer ── health probe: GET /api/health (expects 200)
        │
   ┌────┴─────┐
 app-1      app-2    (stateless, JWT auth — any instance serves any request)
   │          │
   └────┬─────┘
   Upstash Redis  ← shared cache (single-flight across ALL instances)
```

---

## 5. Scalability Strategies

- **Stateless app = linear scale-out.** NextAuth JWT (`src/auth.ts`) means no session store and no sticky sessions.

- **Enable the shared cache.** Set `UPSTASH_REDIS_REST_URL`/`_TOKEN`. The `getOrFetch` single-flight (`src/lib/cache.ts`) guarantees one upstream call per key per TTL across the whole cluster.

- **Per-instance limits:** With N replicas, `rate-limiter.ts` and `circuit-breaker.ts` each hold their own counters:
  - Effective request budget ≈ `limit × N` (permissive, not global).
  - A circuit trips on one instance only — others keep hitting a failing upstream until they trip too.
  - **Mitigation:** Acceptable at ≤2–3 replicas; for global budgets, back `rateLimit()` with Redis `INCR+EXPIRE` and `getCircuit()` state with Redis.

- **CDN caching:** Static assets, map tiles, and long-TTL routes (`/api/trains/[trainNo]/route`, elevation — 1h) already emit `s-maxage`/`stale-while-revalidate`.

- **Client polling is load-aware:** `useTracking.ts` jitters its 15s `refetchInterval` (±5s) and pauses on hidden tabs.

- **Upstream load shedding:** Overpass is single-attempt (`retries: 0`), others bounded with jitter (`upstream.ts`); circuit breakers cap wasted attempts.

---

## 6. Security Hardening

### Already handled in code — verify, don't redo

- ✅ Strict nonce CSP (`src/proxy.ts`) — frame-ancestors `'none'`, object-src `'none'`, `upgrade-insecure-requests`.
- ✅ Security headers (`next.config.ts`) — HSTS, X-Frame-Options: DENY, Referrer-Policy, X-Content-Type-Options, etc.
- ✅ API keys never in the browser — all upstream calls go through server routes.
- ✅ Credentials brute-force protection — `/api/auth/callback/credentials` throttled to 10/min/IP.
- ✅ Log credential redaction — `upstream.ts` strips `appid`/`key`/`token` from logged URLs.
- ✅ Rate limiting on every data route, scoped per route, user-aware when signed in.

### Deployment-time checklist

- [ ] TLS at the edge; HSTS preload after confirming HTTPS everywhere
- [ ] `AUTH_TRUST_HOST=true` + correct `NEXT_PUBLIC_APP_URL`
- [ ] Secrets only in the platform secret store (never in images, compose, or CI logs)
- [ ] Non-root container user (`USER nextjs`) + read-only root FS if supported
- [ ] Restrict MapTiler key to your host in the MapTiler console
- [ ] Dependency scanning in CI (`npm audit`, Trivy, Dependabot)
- [ ] No permissive CORS — the app is same-origin; don't add `Access-Control-Allow-Origin: *`
- [ ] Do not expose `/api/health` internals publicly beyond `ok/status/dependencies/circuits`
- [ ] Key rotation runbook for `AUTH_SECRET` (dual-issue before switching) and provider API keys

---

## 7. Monitoring & Logging

### 7.1 Logging (implemented)

- JSON structured logs on stdout (`logger.ts`) → ship via the platform's log agent to Loki / CloudWatch / DataDog.
- `LOG_LEVEL=info` in prod; use `debug` only when tracing a specific `x-request-id`.
- Every request has an `x-request-id` echoed in API responses for correlation.

### 7.2 Health & readiness (implemented)

`GET /api/health` returns:
```json
{
  "ok": true,
  "status": "healthy",
  "dependencies": { "cache": "up" },
  "circuits": { "railradar": "closed", "openweather": "closed" }
}
```

- Wire to the LB probe and K8s `livenessProbe`/`readinessProbe`.
- `503` means the instance can't reach the shared cache → the LB drains it.

### 7.3 Metrics (implemented)

`GET /api/metrics` returns Prometheus text exposition format:
- `process_uptime_seconds`, `process_resident_memory_bytes`, `process_heap_*`
- `circuit_breaker_state{upstream="..."}` (0=closed, 0.5=half_open, 1=open)
- `circuit_breaker_open_total`
- `cache_ready` (1=up, 0=down)

### Suggested alerts

| Alert | Threshold | Why |
|---|---|---|
| p99 latency | > 1500ms for 5 min | Upstream or cache degradation |
| 5xx rate | > 2% over 5 min | Errors surfacing to users |
| Circuit open | `railradar`/`overpass` open > 30s | Provider down; check fallback coverage |
| Cache readiness | `/api/health` 503 | Redis unavailable — instance drains |
| Rate-limit rejections | spike > 10× baseline | Possible abuse or buggy client retry loop |
| npm audit / Trivy | any CRITICAL | Enforce in CI |

---

## 8. High Availability Configuration

- **≥2 replicas** across ≥2 availability zones (container platform) or regions (Vercel global).
- **Zero-downtime rollouts:** Rolling updates with minReadySeconds-style gating; the `HEALTHCHECK`/readiness probe blocks routing to a warming instance (start-period 20s).
- **Sticky-less LB:** No affinity — any instance serves any request (JWT stateless).
- **Redis HA:** Upstash is managed (multi-region replicas optional). The app tolerates a Redis outage by falling back to per-instance memory cache and reporting 503 from `/api/health`.
- **Rollback:** Redeploy the previous `$sha` tag — immutable and deterministic.

---

## 9. Deployment Order (execution checklist)

| Step | Action |
|---|---|
| 1 | ✅ `output: 'standalone'` in `next.config.ts` |
| 2 | ✅ Commit `Dockerfile`, `.dockerignore`, `.github/workflows/deploy.yml` |
| 3 | Provision Upstash Redis; store `UPSTASH_REDIS_REST_URL`/`_TOKEN` + all secrets in platform/CI |
| 4 | Configure host/platform: TLS cert, `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_APP_URL`, `LOG_LEVEL=info` |
| 5 | Deploy a single instance to staging; run the §10 smoke checklist |
| 6 | Promote to production with ≥2 replicas + LB health probe on `/api/health` |
| 7 | Attach log shipping (Loki/CloudWatch) and Grafana scraping `/api/metrics` |
| 8 | Turn on alerting; confirm rollback works by redeploying the prior tag |

---

## 10. Post-Deploy Smoke Checklist

```bash
# Readiness + dependency + circuit state
curl -s https://<host>/api/health | jq
# → ok:true, dependencies.cache:"up"

# Prometheus metrics
curl -s https://<host>/api/metrics
# → process_uptime_seconds, circuit_breaker_state, cache_ready

# Data routes (each should return 200 with Cache-Control + x-request-id)
curl -s "https://<host>/api/trains/search?q=12952"
curl -s "https://<host>/api/trains/12952/live"
curl -s "https://<host>/api/trains/12952/route"
curl -s "https://<host>/api/weather?lat=28.6&lng=77.2"
curl -s "https://<host>/api/nearby?lat=28.6&lng=77.2"
curl -s -X POST "https://<host>/api/elevation" \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[[77.2,28.6],[78.0,29.0]]}'

# Rate limiting: burst 15 search requests → 429 envelope with Retry-After
# Login: credentials + OAuth flows complete
# Logs: contain x-request-id; no appid/keys (redaction verified)
```

---

## 11. What's intentionally out of scope

- **User data persistence / favorites sync** — needs a datastore decision (Postgres vs edge KV).
- **Global (Redis-backed) rate limits + shared circuit state** — the seam exists; enable when replica count makes per-instance budgets unacceptable.
- **Booking/inventory** — would require database concurrency patterns (atomic conditional updates, unique seat indexes, idempotency keys).
